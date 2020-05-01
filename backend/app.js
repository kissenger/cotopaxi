// Libraries and stuff
const express = require('express');
const app = express();
const multer = require('multer');
const bodyParser = require('body-parser');
const auth = require('./auth.js');

// Local functions
const Route = require('./_Path').Route;
const GeoJSON = require('./_GeoJson.js').GeoJSON;
const ListData = require('./_ListData.js').ListData;
const readGPX = require('./gpx.js').readGPX;
const writeGPX = require('./gpx.js').writeGPX;
const debugMsg = require('./utils').debugMsg;

// Mongoose setup ... mongo password: p6f8IS4aOGXQcKJN
const mongoose = require('mongoose');
const MongoPath = require('./models/path-models');

/******************************************************************
 *
 * SETUP
 *
 ******************************************************************/

app.use( (req, res, next) => {
  // inject a header into the response
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Headers","Origin, X-Request-With, Content-Type, Accept, Authorization, Content-Disposition");
  res.setHeader("Access-Control-Allow-Methods","GET, POST, PATCH, DELETE, OPTIONS");

  next();
});

app.use(bodyParser.json());
app.use(auth.authRoute);

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

/**
 * import a route from a gpx file
 */

  app.post('/import-route/', auth.verifyToken, upload.single('filename'), (req, res) => {

    debugMsg('import-route');

    const pathFromGPX = readGPX(req.file.buffer.toString());
    const path = new Route(pathFromGPX.nameOfPath, null, pathFromGPX.lngLat, pathFromGPX.elev);
    const geoHills = new GeoJSON();

    path.init()
      .then( () => mongoModel('route').create( path.asMongoObject(req.userId, false) ) )
      .then( (doc) => res.status(201).json( {hills: geoHills.fromDocument(doc).toGeoHills()} ))
      .catch( (err) => {
        res.status(500).json(err.toString());
        debugMsg('ERROR:' + err);
      })

  });



/*****************************************************************
 * Save a path to database - path has already been saved to the
 * database, all we are doing is updating some fields, and
 * changing isSaved flag to true; id of path is provided
 *****************************************************************/

app.post('/save-imported-path/', auth.verifyToken, (req, res) => {

  debugMsg('save-imported-path');

  // set up query
  const condition = {_id: req.body.pathId, userId: req.userId};
  const filter = {isSaved: true, "info.name": req.body.name, "info.description": req.body.description};

  // query database, updating changed data and setting isSaved to true
  mongoModel(req.body.pathType)
    .updateOne(condition, {$set: filter}, {upsert: true, writeConcern: {j: true}})
    .then( () => {
      res.status(201).json( {pathId: req.body.pathId} );
    })
    .catch( (err) => {
      res.status(500).json(err.toString());
      debugMsg('ERROR:' + err);
    })

});


/*****************************************************************
 * Save a user-created route to database; geoJSON is supplied in POST body
 *****************************************************************/

app.post('/save-created-route/', auth.verifyToken, (req, res) => {

  debugMsg('save-created-route' );

  const path = new Route(req.body.name, req.body.description, req.body.coords, req.body.elevs);
  path.init()
    .then( () => mongoModel('route').create( path.asMongoObject(req.userId, true) ))
    .then( (doc) => res.status(201).json( {pathId: doc._id} ))
    .catch( (err) => {
      res.status(500).json(err.toString());
      debugMsg('ERROR:' + err);
    });

});


/*****************************************************************
 *  Retrieve a single path from database
 *  id of required path is supplied
 *****************************************************************/

app.get('/get-path-by-id/:type/:id', auth.verifyToken, (req, res) => {

  debugMsg('get-path-by-id');

  const geoHills = new GeoJSON();   // used for standard route display
  const geoRoute = new GeoJSON();   // used when overlaying a route in create mode

  getPathDocFromId(req.params.id, req.params.type, req.userId)
    .then( doc => {
      res.status(201).json({
        hills: geoHills.fromDocument(doc).toGeoHills(),
        geoJson: geoRoute.fromDocument(doc).toGeoRoute()
      });
    })
    .catch( (err) => {
      res.status(500).json(err.toString());
      debugMsg('ERROR:' + err);
    });
})


/*****************************************************************
 * Flush database of all unsaved entries
 * note we are only flushing routes at the moment
 *****************************************************************/
app.post('/flush/', auth.verifyToken, (req, res) => {

  debugMsg('flush db');

  mongoModel('route').deleteMany( {'userId': userId, 'isSaved': false} )
    // .then( () => mongoModel('tracks').deleteMany( {'userId': userId, 'isSaved': false} )
    .then( () => res.status(201).json( {'result': 'db flushed'} ))
    .catch( (err) => {
      res.status(500).json(err.toString());
      debugMsg('ERROR:' + err);
    });

})

/*****************************************************************
 * Retrieve a list of paths from database - if bbox is supplied it
 * will return only paths intersecting with the bbox, otherwise returns
 * all
 * bbox is delivered as a req parameter - either array or 0 if not reqd
 * pathType is the type of path (obvs)
 * offset is used by list to request chunks of x paths at a time
 *****************************************************************/

app.get('/get-paths-list/:pathType/:offset/:limit', auth.verifyToken, (req, res) => {

  debugMsg('get-paths-list');

  // setup query
  let condition = {isSaved: true, userId: req.userId};
  if (req.query.bbox !== '0') {
    const geometry = { type: 'Polygon', coordinates: bbox2Polygon(req.query.bbox) };
    condition = {...condition, geometry: { $geoIntersects: { $geometry: geometry} } }
  }
  const filter = {stats: 1, info: 1, startTime: 1, creationDate: 1};
  const sort = req.params.pathType === 'track' ? {startTime: -1} : {creationDate: -1};

  // the front end would like to know how many paths there are in total, so make that the first query
  mongoModel(req.params.pathType)
    .countDocuments(condition)
    .then( count => {
      mongoModel(req.params.pathType)
        .find(condition, filter).sort(sort).limit(parseInt(req.params.limit)).skip(req.params.limit*(req.params.offset))
        .then(documents => res.status(201).json(new ListData(documents, count)))
      })
    .catch( (err) => {
      res.status(500).json(err.toString());
      debugMsg('ERROR:' + err);
    });

})

/*****************************************************************
 * Delete a path from database
 * id of path is provided - doesnt actually delete, just sets isSaved to false
 * and delete will occur at the next flush
 *****************************************************************/

app.delete('/delete-path/:type/:id', auth.verifyToken, (req, res) => {

  debugMsg('delete-path');

  // construct query
  let condition = {_id: req.params.id, userId: req.userId};
  let filter = {isSaved: false};

  // query database, updating change data and setting isSaved to true
  mongoModel(req.params.type)
    .updateOne(condition, {$set: filter})
    .then( () => res.status(201).json( {'result': 'delete ok'} ) )
    .catch( (err) => {
      res.status(500).json(err.toString());
      debugMsg('ERROR:' + err);
    });

});

/*****************************************************************
 * Export of a path to file comes in two steps:
 * 1) write-path-to-gpx: retrieve the path from db and call writeGPX, which saves the
 *    data to file, returning the filename
 * 2) download-file: allow the browser to download the file
 *****************************************************************/

 // Step 1, write the data to gpx file
app.get('/write-path-to-gpx/:type/:id', auth.verifyToken, (req, res) => {

  debugMsg('Write path to gpx');

  mongoModel(req.params.type)
    .find({_id: req.params.id, userId: req.userId})
    .then( document => {

      const pathToExport = {
        name: document[0].info.name,
        description: document[0].info.description,
        lngLat: document[0].geometry.coordinates,
        elevs: document[0].params.elev
      }

      writeGPX(pathToExport).then( (fileName) => {
        res.status(201).json({fileName});
      });

    })
    .catch( (err) => {
      res.status(500).json(err.toString());
      debugMsg('ERROR:' + err);
    });;
})

// Step 2, download the file to browser
app.get('/download-file/:fname', auth.verifyToken, (req, res) => {

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
app.post('/get-path-from-points/', auth.verifyToken, (req, res) => {

  debugMsg('get-path-from-points')

  const lngLats = req.body.coords.map(coord => [coord.lng, coord.lat]);
  const path = new Route('', '', lngLats, []);
  const geoHills = new GeoJSON();

  // simplify the path when creating a route in order to keep as
  // responsive as possible for long routes - do this by passing true to init
  path.init()
    .then( () => res.status(201).json( {hills: geoHills.fromPath(path).toGeoHills() } ))
    .catch( (err) => {
      res.status(500).json(err.toString());
      debugMsg('ERROR:' + err);
    })

})


/*****************************************************************
 *
 *  LOCAL FUNCTIONS
 *
 *****************************************************************/
/**
 * Returns the model definition for a given path type
 * @param {string} pathType 'challenge', 'route', 'track' or 'match'
 */
function mongoModel(pathType) {
  switch(pathType) {
    case 'challenge': return MongoChallenges.Challenges;
    case 'route': return MongoPath.Routes;
    case 'track': return MongoPath.Tracks;
    case 'match': return MongoMatch.Match;
  }
}

/**
 * get a mongo db entry from a provided path id
 * @param {string} pid path id
 * @param {string} ptype path type - 'challenge', 'route', 'track' or 'match'
 * @returns mongo document
 */
function getPathDocFromId(pid, ptype, uid) {

  return new Promise( resolve => {
    mongoModel(ptype).find({_id: pid, userId: uid}).then( (path) => {
      resolve(path[0]);
    })
  })

}

/**
 * Converts standard bounding box to polygon for mongo geometry query
 * @param {number} bbox bounding box as [minlng, minlat, maxlng, maxlat]
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


module.exports = app;

