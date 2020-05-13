
"use strict"

/**
 * Handles the public interface with the front-end.  Only routes are specified in this module
 * (with some others in app-auth.js) with suppporting functions abstracted to 'app-functions.js'
 */

import express from 'express';
import multer from 'multer';
import bodyParser from 'body-parser';
import { authRoute, verifyToken } from './app-auth.js';
import mongoose from 'mongoose';
import { GeoJSON } from './class-geojson.js';
import { readGPX } from './gpx.js';
import { debugMsg } from './debugging.js';
import {mongoModel, getPathDocFromId, createMongoModel, bbox2Polygon, getFindFromMongo} from './app-functions.js';
import {getListData, documentToGpx, getRouteInstance} from './app-functions.js';
import {returnError, returnObject} from './app-functions.js';


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
// Mongoose setup ... mongo password: p6f8IS4aOGXQcKJN
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

export default app;


