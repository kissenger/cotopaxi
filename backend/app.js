"use strict"

// Libraries and modules
import express from 'express';
import multer from 'multer';
import bodyParser from 'body-parser';
import { authRoute, verifyToken } from './auth.js';
import mongoose from 'mongoose';

// Local modules
import { Route } from './class-path.js';
import { GeoJSON } from './class-geojson.js';
import { readGPX } from './gpx.js';
import { writeGPX } from './gpx.js';
import { debugMsg } from './utilities.js';

// Mongoose setup ... mongo password: p6f8IS4aOGXQcKJN
import { Routes, Tracks } from './models/path-models.js';

/******************************************************************
 *
 * SETUP
 *
 ******************************************************************/

const app = express();

app.use( (req, res, next) => {
  // inject a header into the response
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Headers","Origin, X-Request-With, Content-Type, Accept, Authorization, Content-Disposition");
  res.setHeader("Access-Control-Allow-Methods","GET, POST, PATCH, DELETE, OPTIONS");

  next();
});

app.use(bodyParser.json());
app.use(authRoute);

// local connection
// mongoose.connect('mongodb://127.0.0.1:27017/trailscape?gssapiServiceName=mongodb',
mongoose.connect('mongodb+srv://root:p6f8IS4aOGXQcKJN@cluster0-gplhv.mongodb.net/trailscape?retryWrites=true',
  {useUnifiedTopology: true, useNewUrlParser: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  debugMsg('MongoDB connected');
});

// multer is used for file uploads, set-up options here
const storageOptions = multer.memoryStorage();
const upload = multer({
  storage: storageOptions,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

/******************************************************************
 *
 * ROUTES
 *
 ******************************************************************/


/*****************************************************************
 * import a route from a gpx file
 ******************************************************************/

app.post('/import-route/', verifyToken, upload.single('filename'), (req, res) => {

  debugMsg('import-route');

  const pathFromGPX = readGPX(req.file.buffer.toString());
  getRouteInstance(pathFromGPX.nameOfPath, null, pathFromGPX.lngLat, pathFromGPX.elev)
    .then( route => createMongoModel('route', route.asMongoObject(req.userId, false)) )
    .then( doc => returnObject( {hills: new GeoJSON().fromDocument(doc).toGeoHills()} ))
    .catch( (err) => returnError(err) )

});


/*****************************************************************
 * Save a path to database - path has already been saved to the
 * database, all we are doing is updating some fields, and
 * changing isSaved flag to true; id of path is provided
 *****************************************************************/

app.post('/save-imported-path/', verifyToken, (req, res) => {

  debugMsg('save-imported-path');

  // set up query
  const condition = {_id: req.body.pathId, userId: req.userId};
  const filter = {isSaved: true, "info.name": req.body.name, "info.description": req.body.description};

  // query database, updating changed data and setting isSaved to true
  mongoModel(req.body.pathType)
    .updateOne(condition, {$set: filter}, {upsert: true, writeConcern: {j: true}})
    .then( () => returnObject({pathId: req.body.pathId}) )
    .catch( (err) => returnError(err) )

});


/*****************************************************************
 * Save a user-created route to database; geoJSON is supplied in POST body
 *****************************************************************/

app.post('/save-created-route/', verifyToken, (req, res) => {

  debugMsg('save-created-route' );

  const lngLats = req.body.coords.map(coord => [coord.lng, coord.lat]);
  getRouteInstance(req.body.name, req.body.description, lngLats, req.body.elev)
    .then( route => mongoModel('route').create( route.asMongoObject(req.userId, true) ))
    .then( () => returnObject( {pathId: doc._id} ))
    .catch( (err) => returnError(err) )

});


/*****************************************************************
 *  Retrieve a single path from database
 *  id of required path is supplied
 *****************************************************************/

app.get('/get-path-by-id/:type/:id', verifyToken, (req, res) => {

  debugMsg('get-path-by-id');

  getPathDocFromId(req.params.id, req.params.type, req.userId)
    .then( doc => returnObject({
      hills: new GeoJSON().fromDocument(doc).toGeoHills(),
      basic: new GeoJSON().fromDocument(doc).toBasic()
    }) )
    .catch( (err) => returnError(err) )
})


/*****************************************************************
 * Flush database of all unsaved entries
 * note we are only flushing routes at the moment
 *****************************************************************/
app.post('/flush/', verifyToken, (req, res) => {

  debugMsg('flush db');

  mongoModel('route').deleteMany( {'userId': userId, 'isSaved': false} )
    .then( () => returnObject( {result: 'db flushed'} ))
    .catch( (err) => returnError(err) )

})


/*****************************************************************
 * Retrieve a list of paths from database - if bbox is supplied it
 * will return only paths intersecting with the bbox, otherwise returns
 * all
 * bbox is delivered as a req parameter - either array or 0 if not reqd
 * pathType is the type of path (obvs)
 * offset is used by list to request chunks of x paths at a time
 *****************************************************************/

app.get('/get-paths-list/:pathType/:offset/:limit', verifyToken, (req, res) => {

  debugMsg('get-paths-list');

  // setup query
  let condition = {isSaved: true, userId: req.userId};
  if (req.query.bbox !== '0') {
    const geometry = { type: 'Polygon', coordinates: bbox2Polygon(req.query.bbox) };
    condition = {...condition, geometry: { $geoIntersects: { $geometry: geometry} } }
  }
  const filter = {stats: 1, info: 1, startTime: 1, creationDate: 1};
  const sort = req.params.pathType === 'track' ? {startTime: -1} : {creationDate: -1};
  const limit = req.params.limit;
  const offset = req.params.offset

  // the front end would like to know how many paths there are in total, so make that the first query
  mongoModel(req.params.pathType).countDocuments(condition)
    .then( count => getFindFromMongo(condition, filter, sort, limit, offset) )
    .then( documents => returnObject(getListData(documents, count)))
    .catch( (err) => returnError(err) )

})


/*****************************************************************
 * Delete a path from database
 * id of path is provided - doesnt actually delete, just sets isSaved to false
 * and delete will occur at the next flush
 *****************************************************************/

app.delete('/delete-path/:type/:id', verifyToken, (req, res) => {

  debugMsg('delete-path');

  // construct query
  let condition = {_id: req.params.id, userId: req.userId};
  let filter = {isSaved: false};

  // query database, updating change data and setting isSaved to true
  mongoModel(req.params.type).updateOne(condition, {$set: filter})
    .then( () => returnObject( {'result': 'delete ok'} ))
    .catch( error => returnError(error) )

});


/*****************************************************************
 * Export of a path to file comes in two steps:
 * 1) write-path-to-gpx: retrieve the path from db and call writeGPX, which saves the
 *    data to file, returning the filename
 * 2) download-file: allow the browser to download the file
 *****************************************************************/

 // Step 1, write the data to gpx file
app.get('/write-path-to-gpx/:type/:id', verifyToken, (req, res) => {

  debugMsg('Write path to gpx');

  mongoModel(req.params.type)
    .find({_id: req.params.id, userId: req.userId})
    .then( document => documentToGpx(document))
    .then( fileName => returnObject( {fileName} ))
    .catch( error => returnError(error))
})


// Step 2, download the file to browser
app.get('/download-file/:fname', verifyToken, (req, res) => {

  debugMsg('Download file from server');

  res.download('../' + req.params.fname + '.gpx', (err) => {
    if (err) {
      console.log('error: ' + err);
    } else {
      console.log('success');
    }
  });

})


/*****************************************************************
 *  Simplify a path provided by the front end, and return it.
 *  Does this by simply creating a route object on the as this
 *  automatically invokes simplification algorithm
 *WILL NEED TO CHANGE AS SIMPLIFY IS MOVED TO GEOLIB AND INPUT IS ARRAY OF POINT INSTANCES
 *
 *****************************************************************/
// app.post('/simplify-path/', (req, res) => {

//   if (DEBUG) { console.log(timeStamp() + '>> simplify-path') };

//   const lngLats = req.body.coords.map(coord => [coord.lng, coord.lat]);
//   const points = lngLats.map(coord => new Point([coord]))
//   res.status(201).json( simplify(points) );

// })


/*****************************************************************
 * Recieves a set of points (lngLats array) from the front end and
 * creates a Path object in order to get elevations and statistics,
 * and returns it back to the front end
 *****************************************************************/

app.post('/get-path-from-points/', verifyToken, (req, res) => {

  debugMsg('get-path-from-points')

  const lngLats = req.body.coords.map(coord => [coord.lng, coord.lat]);

  getRouteInstance(null, null, lngLats, null)
    .then( route => returnObject({
      hills: new GeoJSON().fromPath(route).toGeoHills(),
      basic: new GeoJSON().fromPath(route).toBasic()
    }))
    .catch( (err) => returnError(err) )

})


/*****************************************************************
 *
 *  LOCAL FUNCTIONS
 *
 *****************************************************************/

/*******************
 * Mongo Related
 *******************/

/**
* returns the desired mongo model object
*/
function mongoModel(pathType) {
  switch(pathType) {
    case 'challenge': return MongoChallenges.Challenges;
    case 'route': return Routes;
    case 'track': return Tracks;
    case 'match': return MongoMatch.Match;
  }
}


/**
 * get a mongo db entry from a provided path id
 */
function getPathDocFromId(pid, ptype, uid) {

  return new Promise( resolve => {
    mongoModel(ptype).find({_id: pid, userId: uid}).then( (path) => {
      resolve(path[0]);
    })
  })

}


/**
* Abstract model creation
*/
 function createMongoModel(model, pathType) {
  return new Promise( (resolve, reject) => {
    mongoModel(pathType).create(model)
      .then( doc => resolve(doc) )
      .catch( error => reject(error))
  });
}


/**
* Find a set of documents
*/
function getFindFromMongo(condition, filter, sort, limit, offset) {
  return new Promise( (resolve, reject) => {
    mongoModel(req.params.pathType)
      .find(condition, filter)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(limit*(offset))
    .then( result => resolve(result) )
    .catch( error => reject(error) )
  })
}


/**
 * Converts standard bounding box to polygon for mongo geometry query
 * bbox bounding box as [minlng, minlat, maxlng, maxlat]
 */
function bbox2Polygon(bbox) {
  return [[
    [ bbox[0], bbox[1] ],
    [ bbox[2], bbox[1] ],
    [ bbox[2], bbox[3] ],
    [ bbox[0], bbox[3] ],
    [ bbox[0], bbox[1] ]
  ]]
}


/*******************
 * Other
 *******************/

 /**
  * Returns an object expected by the front end when a list query is made
  * Called by get-paths-list()
  */
function getListData() {

  return docs.map( d => ({
    name: d.info.name,
    stats: d.stats,
    category: d.info.category,
    direction: d.info.direction,
    pathType: d.info.pathType,
    startTime: d.startTime,
    creationDate: d.creationDate,
    isElevations: d.info.isElevations,
    isLong: d.info.isLong,
    pathId: d._id,
    count: c
    })
  );

}


function documentToGpx(document) {

  return new Promise( (resolve, reject) => {

    const pathToExport = {
      name: document[0].info.name,
      description: document[0].info.description,
      lngLat: document[0].geometry.coordinates,
      elevs: document[0].params.elev
    }

    writeGPX(pathToExport)
      .then( fileName => resolve(fileName))
      .catch( error => reject(error))
  })

}


function returnObject(object) {
  res.status(201).json( object );
}


function returnError(error) {
  res.status(500).json(err.toString());
  debugMsg('ERROR:' + err);
}


/**
 * Abstracts the workflow to instantiate a Route given a data array from an import
 */
export function getRouteInstance(name, description, lngLat, elevs) {

  return new Promise ( (resolve, reject) => {
    Route.preFlight(lngLat, elevs)
      .then( prePath => resolve( new Route(name, description, prePath.lngLat, prePath.elev) ))
      .catch( error => reject(error) )
  });

}

export default app;


