// Libraries and stuff
const express = require('express');
const app = express();
const multer = require('multer');
const bodyParser = require('body-parser');

// Local functions
const Route = require('./_Path').Route;
const GeoRoute = require('./_GeoJson.js').GeoRoute;
const GeoHills = require('./_GeoJson.js').GeoHills;
const ListData = require('./_ListData.js').ListData;
const auth = require('./auth.js');
const readGPX = require('./gpx.js').readGPX;
const writeGpx = require('./gpx.js').writeGPX;
const timeStamp = require('./utils.js').timeStamp;
const getElevations = require('./upsAndDowns').upsAndDowns;

// global constants
const DEBUG = true;

// Mongoose setup ... mongo password: p6f8IS4aOGXQcKJN
const mongoose = require('mongoose');
const MongoPath = require('./models/path-models');

/******************************************************************
 *
 * setup
 *
 ******************************************************************/

// Set up Cross Origin Resource Sharing (CORS )
app.use( (req, res, next) => {
  // inject a header into the response
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Headers","Origin, X-Request-With, Content-Type, Accept, Authorization");
  res.setHeader("Access-Control-Allow-Methods","GET, POST, PATCH, DELETE, OPTIONS");

  next();
});

// TODO this is legacy stuff, is it all needed?
app.use(bodyParser.json());
app.use(auth.authRoute);
// app.use(express.static('backend/files'));

/******************************************************************
 *
 * mongo
 *
 ******************************************************************/

// getting-started.js
mongoose.connect('mongodb://127.0.0.1:27017/trailscape?gssapiServiceName=mongodb', {useNewUrlParser: true});

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() { 
  console.log('connected!');
  // we're connected!
});

/*****************************************************************  
 *
 * new file data is submitted from the front end
 *
 *****************************************************************/
var storageOptions = multer.memoryStorage()

var upload = multer({
  storage: storageOptions,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});


/*****************************************************************
 *
 * request elevations
 *
 *****************************************************************/
app.post('/ups-and-downs/v1/', auth.verifyToken, (req, res) => { 

  // check options array - if it's not present then fill it in with falses
  let options = req.body.options;
  if (!options) {
    options = {
      interpolate: false,
      writeResultsToFile: false 
    }
  }

  // this is where the work gets donw
  getElevations(req.body.coordsArray, options).then( result => {
    res.status(200).json( {result} );
  })
  
});


/*****************************************************************
 *
 *  Import route from file
 *
 *
 *****************************************************************/

  app.post('/import-route/', auth.verifyToken, upload.single('filename'), (req, res) => {

    if (DEBUG) { console.log(timeStamp() + ' >> import-route'); }
  
    // ensure user is authorised
    const userId = req.userId;
    if ( !userId ) {
      res.status(401).send('Unauthorised');
      if (DEBUG) { console.log(' >> Unauthorised') }; 
    }
  
    // const userId = 0;
  
    getMongoFromGpx(userId).then( (mongoPath) => {

      MongoPath.Routes.create(mongoPath).then( (doc) => {
        res.status(201).json({geoJson: new GeoRoute(doc)});
        if (DEBUG) { console.log(timeStamp() + ' >> import-route finished'); }

      }).catch( (err) => { 
        throw err // catch error in the outside catch rather than handle twice
      });

    }).catch( (err) => { 
      res.status(500).json(err.toString());
      if (DEBUG) { console.log(' >> ERROR:' + err); }
     });

  
    function getMongoFromGpx(uid) {

      return new Promise ( (res, rej) => {
        // Get a mongo object from the path data
        try {
          const pathFromFile = readGPX(req.file.buffer.toString());
          var path = new Route(pathFromFile.nameOfPath, undefined, pathFromFile.lngLat, pathFromFile.elev);
          path.userId = uid;  // inject userID into path object
        } catch(error) {
          rej(error);
        }
          
        // once Path is instantiated, it needs to be initialised (returns a promise)
        path.getElevations().then( () => {
          const mongoPath = path.asMongoObject(userId, false);
          res(mongoPath);
        }).catch( (err) => {
          rej(err);
        })
        
      })
  
    };
  
  })



/*****************************************************************
 *
 *  Save a path to database - path has already been saved to the 
 *  database, all we are doing is updating some fields, and 
 *  changing isSaved flag to true; id of path is provided
 *
 *****************************************************************/

app.post('/save-imported-path/', auth.verifyToken, (req, res) => {

  // ensure user is authorised
  const userId = req.userId;
  if ( !userId ) {
    res.status(401).send('Unauthorised');
    if (DEBUG) { console.log(' >> Unauthorised') }; 
  }

  // construct query based on incoming payload
  if (DEBUG) { console.log(timeStamp() + ' >> save-imported-path' )};

  let condition = {_id: req.body.pathId};
  let filter = {isSaved: true, "info.name": req.body.name, "info.description": req.body.description};

  // query database, updating changed data and setting isSaved to true
  mongoModel(req.body.pathType)
    .updateOne(condition, {$set: filter}, {upsert: true, writeConcern: {j: true}})
    .then( () => {
      res.status(201).json( {pathId: req.body.pathId} );
    }) 

});


/*****************************************************************
 * Save a user-created route to database; geoJSON is supplied
 *
 *
 *
 *****************************************************************/
app.post('/save-created-route/', auth.verifyToken, (req, res) => {

  // ensure user is authorised
  const userId = req.userId;
  if ( !userId ) {
    res.status(401).send('Unauthorised');
    if (DEBUG) { console.log(' >> Unauthorised') }; 
  }

  // console.log(req.body);

  if (DEBUG) { console.log(timeStamp() + ' >> save-created-route' )};
  var path = new Route(req.body.name, req.body.description, req.body.coords, req.body.elevs);
// console.log(path);
  // get elevations wont get new ones if elevations are supplied
  path.getElevations().then( () => {
    // console.log(path);
    const mongoPath = path.asMongoObject(userId, true);
    mongoModel('route').create(mongoPath).then( (document) => {
      res.status(201).json( {pathId: document._id} );  
    }) 
  });
})



/*****************************************************************
 *  Retrieve a single path from database
 *  id of required path is supplied
 *****************************************************************/
app.get('/get-path-by-id/:type/:id', auth.verifyToken, (req, res) => {

  // ensure user is authorised
  const userId = req.userId;
  if ( !userId ) {
    res.status(401).send('Unauthorised');
    if (DEBUG) { console.log(' >> Unauthorised') }; 
  }

  // query the database and return result to front end
  getPathDocFromId(req.params.id, req.params.type).then( path => {
    // console.log(path);
      res.status(201).json({
        geoJson: new GeoRoute(path),
        hills: new GeoHills(path)
      });
  })
})


/*****************************************************************
 *
 *  Flush database of all unsaved entries
 *
 *****************************************************************/
app.post('/flush/', auth.verifyToken, (req, res) => {

  // ensure user is authorised
  const userId = req.userId;
  if ( !userId ) {
    res.status(401).send('Unauthorised');
    if (DEBUG) { console.log(' >> Unauthorised') }; 
  }
  
  mongoModel('route').deleteMany( {'userId': userId, 'isSaved': false} ).then( () => {
    // MongoPath.Tracks.deleteMany( {'isSaved': false} ).then( () => {
      // MongoChallenges.Challenges.deleteMany( {'isSaved': false} ).then( () => {
        if (DEBUG) { console.log(timeStamp() + ' >> database flush' )};
        res.status(201).json( {'result': 'db flushed'} );
      // });
    // });
  });

})

/*****************************************************************
 * 
 *  Retrieve a list of paths from database
 * 
 *****************************************************************/

app.get('/get-paths-list/:type/:offset', auth.verifyToken, (req, res) => {

  if (DEBUG) { console.log(timeStamp() + ' >> get-paths-list, pathType=', req.params.type, ', offset=', req.params.offset )};
  const LIMIT = 9 //number of items to return in one query

  // ensure user is authorised
  const userId = req.userId;
  if ( !userId ) {
    res.status(401).send('Unauthorised');
    if (DEBUG) { console.log(' >> Unauthorised') }; 
  }

  // get the appropriate model and setup query
  let condition = {isSaved: true, userId: userId};
  let filter = {stats: 1, info: 1, startTime: 1, creationDate: 1};
  let sort = req.params.type === 'track' ? {startTime: -1} : {creationDate: -1};
    
  // the front end would like to know how many paths there are in total, so make that the first query
  mongoModel(req.params.type).countDocuments(condition).then( (count) => {
    mongoModel(req.params.type)
      .find(condition, filter).sort(sort).limit(LIMIT).skip(LIMIT*(req.params.offset))
      .then(documents => {
        res.status(201).json(new ListData(documents, count))
      });
  })
})


/*****************************************************************
 * 
 *  Get a list of routes that intersect with a provided bounding box
 * 
 *****************************************************************/

app.get('/get-intersecting-routes', auth.verifyToken, (req, res) => {

  if (DEBUG) { console.log(timeStamp() + ' >> get-overlay-list, pathType=', req.params.type, ', offset=', req.params.offset )};

  // ensure user is authorised
  const userId = req.userId;
  if ( !userId ) {
    res.status(401).send('Unauthorised');
    if (DEBUG) { console.log(' >> Unauthorised') }; 
  }

  // let condition = {userId: userId};
  let filter = {stats: 1, info: 1, startTime: 1, creationDate: 1};
  let geometry = { 'type': 'Polygon', 'coordinates': bbox2Polygon(req.query.bbox) };

  mongoModel('route')
    .find( {userId: userId, geometry: { $geoIntersects: { $geometry: geometry} } }, filter)
    .then( (documents) => {
      res.status(201).json(new ListData(documents))
    })


})


/*****************************************************************
 *  Delete a path from database
 *  id of path is provided - doesnt actually delete, just sets isSaved to false
 *****************************************************************/

app.delete('/delete-path/:type/:id', auth.verifyToken, (req, res) => {

  if (DEBUG) { console.log(timeStamp() + ' >> delete-path')};

  // ensure user is authorised
  const userId = req.userId;
  if ( !userId ) {
    res.status(401).send('Unauthorised');
    if (DEBUG) { console.log(' >> Unauthorised') }; 
  }

  // construct query based on incoming payload
  let condition = {_id: req.params.id, userId: userId};
  let filter = {isSaved: false};

  // query database, updating change data and setting isSaved to true
  mongoModel(req.params.type)
    .updateOne(condition, {$set: filter})
    .then( () => { res.status(201).json( {'result': 'delete ok'} ) },
        (err) => { res.status(201).json(err) });

});

/*****************************************************************
 * Export a path to file
 *
 *
 *
 *****************************************************************/
app.post('/export-path', auth.verifyToken, (req, res) => {

  if (DEBUG) { console.log(timeStamp() + ' >> export path' )};

  // ensure user is authorised
  const userId = req.userId;
  if ( !userId ) {
    res.status(401).send('Unauthorised');
    if (DEBUG) { console.log(' >> Unauthorised') }; 
  }


  mongoModel(req.body.pathType).find({_id: req.body.pathId}).then(document => {

    let route = new Route(
      document[0].info.name, 
      document[0].info.description, 
      document[0].geometry.coordinates, 
      document[0].params.elev);

    writeGpx(route).then( (fileName) => {
      res.status(201).json({fileName});
    });

  });
})

  
app.get('/download/:fname', auth.verifyToken, (req, res) => {

  // ensure user is authorised
  const userId = req.userId;
  if ( !userId ) {
    res.status(401).send('Unauthorised');
    if (DEBUG) { console.log(' >> Unauthorised') }; 
  }

  res.download('../' + req.params.fname + '.gpx', (err) => {
    if (err) {
      console.log('error: ' + err);
    } else {
      console.log('success');
    }
  } );

})





/*****************************************************************
 *
 *  Simplify a path provided by the front end, and return it.
 *  Does this by simply creating a route object on the as this
 *  automatically invokes simplification algorithm
 *WILL NEED TO CHANGE AS SIMPLIFY IS MOVED TO GEOLIB AND INPUT IS ARRAY OF POINT INSTANCES
 *****************************************************************/
// app.post('/simplify-path/', (req, res) => {

//   if (DEBUG) { console.log(timeStamp() + '>> simplify-path') };

//   const lngLats = req.body.coords.map(coord => [coord.lng, coord.lat]); 
//   const points = lngLats.map(coord => new Point([coord]))
//   res.status(201).json( simplify(points) );

// })

/*****************************************************************
 *
 *  Simplify a path provided by the front end, and return it.
 *  Does this by simply creating a route object on the as this
 *  automatically invokes simplification algorithm
 *WILL NEED TO CHANGE AS SIMPLIFY IS MOVED TO GEOLIB AND INPUT IS ARRAY OF POINT INSTANCES
 *****************************************************************/
app.post('/process-points/', auth.verifyToken, (req, res) => {

  if (DEBUG) { console.log(timeStamp() + '>> process-points-from-front') };

  // ensure user is authorised
  const userId = req.userId;
  if ( !userId ) {
    res.status(401).send('Unauthorised');
    if (DEBUG) { console.log(' >> Unauthorised') }; 
  }

  const lngLats = req.body.coords.map(coord => [coord.lng, coord.lat]);
  
  var path = new Route('', '', lngLats, req.body.elevs);
  // console.log(req.body);
  path.getElevations().then( () => {
    res.status(201).json({
      geoJson: new GeoRoute(path),
      hills: new GeoHills(path)
    });
  });

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
 */
function getPathDocFromId(pid, ptype) {

  return new Promise( resolve => {
    mongoModel(ptype).find({_id: pid}).then( (path) => {
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

