// Libraries and stuff
const express = require('express');
const app = express();
const multer = require('multer');
const bodyParser = require('body-parser');

// const request = require('request');

const DEBUG = true;
// const DEBUG = false;

// Local functions
const Route = require('./_Path').Route;
const Path = require('./_Path').Path;
const GeoJSON = require('./_GeoJson.js').GeoJSON;
const ListData = require('./_ListData.js').ListData;
const auth = require('./auth.js');
const readGPX = require('./gpx.js').readGPX;
const timeStamp = require('./utils.js').timeStamp;
const getElevations = require('./upsAndDowns').upsAndDowns;


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

// some stuff
app.use(bodyParser.json());
app.use(auth.authRoute);
app.use(express.static('backend/files'));

/******************************************************************
 *
 * mongo
 *
 ******************************************************************/

// mongoose.connect('mongodb+srv://root:p6f8IS4aOGXQcKJN@cluster0-gplhv.mongodb.net/test?retryWrites=true')
//   .then(() => {  console.log('Connected to database'); })
//   .catch(() => { console.log('Connection to database failed'); });

// mongoose.connect('mongodb+srv://root:p6f8IS4aOGXQcKJN@cluster0-gplhv.mongodb.net/test?retryWrites=true')

mongoose.connect('mongodb://127.0.0.1:27017/trailscape?gssapiServiceName=mongodb')
  .then(() => { console.log('Connected to database'); })
  .catch(() => { console.log('Connection to database failed'); });

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
app.post('/ups-and-downs/v1/', (req, res) => { 

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

// app.post('/import-route/', auth.verifyToken, upload.single('filename'), (req, res) => {
app.post('/import-route/', upload.single('filename'), (req, res) => {

  if (DEBUG) { console.log(timeStamp() + ' >> import-route'); }

  // ensure user is authorised
  // const userId = req.userId;
  // if ( !userId ) {
  //   res.status(401).send('Unauthorised');
  // }

  const userId = 0;

  // Get a mongo object from the path data
  const pathFromFile = readGPX(req.file.buffer.toString());
  const Path = new Route(pathFromFile.nameOfPath, ' ', pathFromFile.lngLat, pathFromFile.elevations);

  // once Path is instantiated, it needs to be initialised (returns a promise)
  Path.init().then( () => {
    const mongoPath = Path.asMongoObject(userId, false);

    // Save route into database with isSaved = false, and return it to the front end
    MongoPath.Routes.create(mongoPath).then( (docs) => {
      // MongoPath.Routes.insertMany({"x":2}).then( (docs) => {    
        // console.log(docs);
        res.status(201).json({geoJson: new GeoJSON(docs, 'route')});
        if (DEBUG) { console.log(timeStamp() + ' >> import-route finished'); }
      })
    });

});



/*****************************************************************
 *
 *  Save a path to database from review page
 *  id of path is provided
 *
 *****************************************************************/

// app.post('/save-path/:type/:id',  auth.verifyToken, (req, res) => {
app.post('/save-path/:type/:id', (req, res) => {

  // ensure user is authorised
  // if ( !req.userId ) {
  //   res.status(401).send('Unauthorised');
  // }

  // construct query based on incoming payload
  let condition = {_id: req.params.id, userId: req.userId};
  let filter = {isSaved: true};
  if ( typeof req.body.description !== "undefined" ) { filter['description'] = req.body.description; }
  if ( typeof req.body.name !== "undefined" ) { filter['name'] = req.body.name; }

  // query database, updating changed data and setting isSaved to true
  mongoModel(req.params.type)
    .updateOne(condition, {$set: filter}, {writeConcern: {j: true}})
    .then( () => {
      res.status(201).json( {result: 'save ok'} );
    }) 

});






// &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&
// &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&
//
// everything after here to be checked
//
// &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&
// &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&

/**
 *
 *
 */
app.post('/add-elev-to-path/:type/:id', auth.verifyToken, (req, res) => {

  if (DEBUG) { console.log('-->add-elev-to-path: req.body = ', req.body) };
  if (DEBUG) { console.log('-->add-elev-to-path: req.params = ', req.params) };

  // ensure user is authorised
  const userId = req.userId;
  if ( !userId ) {
    res.status(401).send('Unauthorised');
  }

  // construct query based on incoming payload
  let filter = {_id: req.params.id,  userId: userId};
  // let update = {'params.elev': req.body};
  let newElevs = req.body;

  // query the database tp find the current entry that needs to be modified - we'll take the data we need
  getPathDocFromId(req.params.id, req.params.type).then( document => {
    if (DEBUG) {
      console.log(document);
    }

    // we need to create a new instance which will replace the current db entry (so that path can be processed with new data)
    if ( req.params.type === 'track' ) {
      var path = new Track(document.name, document.description, document.geometry.coordinates, newElevs);
    } else {
      var path = new Route(document.name, document.description, document.geometry.coordinates, newElevs);
    }

    // replace the entry in the db and tell the front end that we're done
    const mPath = path.mongoFormat(req.userId, true);
    mongoModel(req.params.type)
      .replaceOne(filter, mPath, {writeConcern: {j: true}})
      .then( () => {

        res.status(201).json({geoJson: new GeoJson(mPath, 'route')});
        // respond to the front end
        // res.status(201).json( {'path': mPath} );

        // recheck db entry if needed
        if (DEBUG) {
          getPathDocFromId(req.params.id, req.params.type).then( document => {
            console.log('--------------------');
            console.log(document);
            console.log('--------------------');
          });
        }

      } );

  });


});




/**
 *
 *
 */
app.get('/reverse-path/:type/:id', auth.verifyToken, (req, res) => {

  if (DEBUG) { console.log('-->add-elev-to-path: req.params.type = ', req.params.type) };
  if (DEBUG) { console.log('-->add-elev-to-path: req.params.id = ', req.params.id) };

  // ensure user is authorised
  const userId = req.userId;
  if ( !userId ) {
    res.status(401).send('Unauthorised');
  }

  // construct query based on incoming payload
  let filter = {_id: req.params.id,  userId: userId};

  // query the database tp find the current entry that needs to be modified - we'll take the data we need
  getPathDocFromId(req.params.id, req.params.type).then( document => {

    // get the coordinates and reverse them
    newCoords = document.geometry.coordinates.reverse();
    newElevs = document.params.elev.reverse();

    // we need to create a new instance which will replace the current db entry (so that path can be processed with new data)
    var newPath = new Route(document.name, document.description, newCoords, newElevs);

    // replace the entry in the db and tell the front end that we're done
    const mPath = newPath.mongoFormat(req.userId, true);
    mongoModel(req.params.type)
      .replaceOne(filter, mPath, {writeConcern: {j: true}})
      .then( () => {

        // make a geoJSON object and inject the pathID
        newPath = {geoJson: new GeoJson(mPath, 'route')};
        newPath.geoJson.properties['pathId'] = req.params.id

        // and return to the front end
        res.status(201).json(newPath);

      });
  });


});





/*****************************************************************
 *
 *  Simplify a path provided by the front end, and return it.
 *  Does this by simply creating a route object on the as this
 *  automatically invokes simplification algorithm
 *WILL NEED TO CHANGE AS SIMPLIFY IS MOVED TO GEOLIB AND INPUT IS ARRAY OF POINT INSTANCES
 *****************************************************************/
app.post('/simplify-path/', auth.verifyToken, (req, res) => {

  if (DEBUG) { console.log('-->simplify-path: req.body = ', req.body); }

  // ensure user is authorised
  const userId = req.userId;
  if ( !userId ) {
    res.status(401).send('Unauthorised');
  }

  var path = new Route('', '', req.body.geometry.coordinates, []);
  res.status(201).json(path);

})


/*****************************************************************
 *
 *  Import track or tracks from file
 *
 *
 *****************************************************************/
app.post('/import-tracks/:singleOrBatch', auth.verifyToken, upload.array('filename', 500), (req, res) => {

  // ensure user is authorised
  const userId = req.userId;
  if ( !userId ) {
    res.status(401).send('Unauthorised');
  }

  // read data into buffer and interprete gpx
  const gpxBuffer = req.files.map(a => a.buffer.toString());
  let paths = gpxBuffer.map(readGpx);

  if ( req.params.singleOrBatch === 'batch' ) {
    MongoPath.Tracks
      .insertMany(paths.map(p => p.mongoFormat(userId, true)), {writeConcern: {j: true}})
      .then( (documents) => {

        res.status(201).json({ 'result': 'bulk write ok'});
        trackIds = documents.map( (d) => d._id );

        // update match
        p = Promise.resolve();
        for (let i = 0; i < trackIds.length; i++) {
          p = p.then( () => new Promise( resolve => {
              matchNewTrack(trackIds[i]).then( () => resolve() );
            })
          );
        }

      });

  } else {
    // single upload

    MongoPath.Tracks
      .create(paths.map(p => p.mongoFormat(userId, false)))
      .then( (documents) => {
        res.status(201).json({geoJson: new GeoJson(documents, 'route')});
      })
  }

});





/*****************************************************************
 *
 *  Save a path to database from review page
 *  id of path is provided
 *
 *****************************************************************/

app.post('/save-path/:type/:id',  auth.verifyToken, (req, res) => {

  // ensure user is authorised
  if ( !req.userId ) {
    res.status(401).send('Unauthorised');
  }

  // construct query based on incoming payload
  let condition = {_id: req.params.id, userId: req.userId};
  let filter = {isSaved: true};
  if ( typeof req.body.description !== "undefined" ) { filter['description'] = req.body.description; }
  if ( typeof req.body.name !== "undefined" ) { filter['name'] = req.body.name; }

  // query database, updating change data and setting isSaved to true
  mongoModel(req.params.type)
    .updateOne(condition, {$set: filter}, {writeConcern: {j: true}})
    .then( () => {
      res.status(201).json( {'result': 'save ok'} );

      if ( req.params.type === 'track' ) {
        matchNewTrack(req.params.id);

      } else if ( req.params.type === 'challenge' ) {
        newMatchFromChallengeId(req.params.id).then( (newMatch) => {
          mongoModel('match').create(newMatch).then( () => {
            //TODO noftify not working
            notify(req.userId, req.params.id, 'route', 'New Challenge', 'Analysis of new challenge route complete');
          });
        });

      } // if
    }) // then

});




/*****************************************************************
 *  Delete a path from database
 *  id of path is provided
 *****************************************************************/

app.get('/delete-path/:type/:id', auth.verifyToken, (req, res) => {

  // ensure user is authorised
  const userId = req.userId;
  if ( !userId ) {
    res.status(401).send('Unauthorised');
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
 *  Retrieve a list of paths from database
 *****************************************************************/

app.get('/get-paths-list/:type/:offset', auth.verifyToken, (req, res) => {

  /**
   * returns only:
   *  stats
   *  name
   *  */
  // console.log('>> get-paths-list');
  const LIMIT = 50 //number of items to return in one query

  // ensure user is authorised
  const userId = req.userId;
  if ( !userId ) {
    res.status(401).send('Unauthorised');
  }

  // get the appropriate model and setup query
  let condition = {isSaved: true, userId: userId};
  let filter = {stats: 1, name: 1, pathType: 1, category: 1};
  let sort = {};

  if ( req.params.type === 'track' ) {
    filter['startTime'] = 1;
    sort['startTime'] = -1;
  } else {
    filter['creationDate'] = 1;
    sort['creationDate'] = -1;
  }

  // execute the query and return result to front-end
  mongoModel(req.params.type).countDocuments(condition).then( (count) => {
    console.log(req.params.type);
    mongoModel(req.params.type)
      .find(condition, filter).sort(sort).limit(LIMIT).skip(LIMIT*(req.params.offset))
      .then(documents => {
        console.log(new ListData(documents, count));
        res.status(201).json(new ListData(documents, count))
      });
  })
})


// /*****************************************************************
//  *  Retrieve a single path from database
//  *  id of required path is supplied
//  *****************************************************************/
// app.get('/get-path-by-id/:type/:id/:idOnly', auth.verifyToken, (req, res) => {

//   // ensure user is authorised
//   if ( !req.userId ) {
//     res.status(401).send('Unauthorised');
//   }

//   // query the database and return result to front end
//   if ( req.params.id === '0' ) res.status(201).json({'id': 0})
//   else {

//     console.log('get-path-by-id', req.params.id);

//     getPathFromId(req.params.id, req.params.type).then( path => {

//       if ( req.params.idOnly === 'true' ) res.status(201).json({pathId: path._id});
//       else {
//         if (req.params.type === 'challenge') {
//           getMatchFromDb(path).then( plotOptions => {
//             // console.log(1, req.params.id, plotOptions);
//             res.status(201).json({geoJson: new GeoJson(path), ...plotOptions});
//           });
//         } else {
//           // console.log(2);
//           res.status(201).json({geoJson: new GeoJson(path)});
//         }
//       }
//     })
//   }
// })


/*****************************************************************
 *  Retrieve a single path from database
 *  id of required path is supplied
 *****************************************************************/
app.get('/get-path-by-id/:type/:id', auth.verifyToken, (req, res) => {

  // ensure user is authorised
  if ( !req.userId ) {
    res.status(401).send('Unauthorised');
  }

  // query the database and return result to front end
  getPathDocFromId(req.params.id, req.params.type).then( path => {

    if (req.params.type === 'challenge') {

      getMatchFromDb(path).then( plotOptions => {

        // console.log(1, req.params.id, plotOptions);
        res.status(201).json({geoJson: new GeoJson(path, 'route'), ...plotOptions});
      });
    } else {
      // console.log(2);
      res.status(201).json({geoJson: new GeoJson(path, 'route')});
    }
  })
})


/*****************************************************************
 *  Retrieve a single path from database
 *  Auto-select path based on:
 *    Route: Time route was uploaded
 *    Track: Time track was recorded
 *****************************************************************/
// app.get('/get-path-auto/:type', auth.verifyToken, (req, res) => {

//   // ensure user is authorised
//   const userId = req.userId;
//   if ( !userId ) {
//     res.status(401).send('Unauthorised');
//   }

//   let pathModel;
//   let condition = {}, sort = {};

//   // get the appropriate model
//   if ( req.params.type === 'route' ) { pathModel = MongoPath.Routes };
//   if ( req.params.type === 'challenge' ) { pathModel = MongoPath.Challenges };
//   if ( req.params.type === 'track' ) { pathModel = MongoPath.Tracks };

//   // construct query
//   condition['isSaved'] = 'true';
//   condition['userId'] = userId;
//   sort['startTime'] = -1;

//   // query the database, checking for zero returns and adjusting id accordingly
//   pathModel
//     .find(condition).sort(sort).limit(1)
//     .then(documents => {
//         res.status(201).json({
//           'id': documents.length === 0 ? 0 : documents[0]._id });
//     });

// })


/*****************************************************************
 * Save a user-created route to db
 *
 *
 *
 *****************************************************************/
app.post('/save-created-route/:type', auth.verifyToken, (req, res) => {

  // ensure user is authorised
  if ( !req.userId ) {
    res.status(401).send('Unauthorised');
  }

  console.log('>>save-created-route', req.body);
  if ( req.params.type === 'track' ) {
    var path = new Track(req.body.name, req.body.description, req.body.geometry.coordinates, req.body.params.elev);
  } else {
    var path = new Route(req.body.name, req.body.description, req.body.geometry.coordinates, req.body.params.elev);
  }

  mongoModel(req.params.type).create(path.mongoFormat(req.userId, true)).then( (document) => {
    res.status(201).json({pathId: document._id});
  })
})



/*****************************************************************
 * Export a path to file
 *
 *
 *
 *****************************************************************/
app.get('/export-path/:type/:id/', auth.verifyToken, (req, res) => {

  // ensure user is authorised
  if ( !req.userId ) {
    res.status(401).send('Unauthorised');
  }

  // Read file data & convert to geojson format

  MongoPath.Routes.find({userId: req.userId, _id: req.params.id}).then(document => {

    let route = new Path(document[0].geometry.coordinates, document[0].params.elev);
    writeGpx(route).then( () => {
      res.status(201).json({status: 'export ok'});
    });

  });

})

app.get('/download', (req, res) => {
  res.download('../exported_path.gpx', (err) => {
    if (err) {
      console.log('error: ' + err);
    } else {
      console.log('success');
    }
  } );

})



/*****************************************************************
 *
 *  Return all the tracks associated with a challenge
 *
 *****************************************************************/
app.get('/get-matched-tracks/:challengeId', auth.verifyToken, (req, res) => {

  const userId = req.userId;
  if ( !userId ) {
    res.status(401).send('Unauthorised');
  }

  getMatchingTracksFromMatchObj(req.params.challengeId).then( (tracks) => {
    console.log('> get-matched-tracks: matched ' + tracks.length + ' tracks');
    if (!tracks) {
      res.status(201).json({result: 'no matched tracks'})
    } else {
      res.status(201).json({geoTracks: geoJson = new GeoJson(tracks, 'tracks')})
    }
  })

})


/*****************************************************************
 *
 *  Flush database of all unsaved entries
 *
 *****************************************************************/
app.get('/flush', (req, res) => {

  MongoPath.Routes.deleteMany( {'isSaved': false} ).then( () => {
    MongoPath.Tracks.deleteMany( {'isSaved': false} ).then( () => {
      MongoChallenges.Challenges.deleteMany( {'isSaved': false} ).then( () => {
        res.status(201).json( {'result': 'db flushed'} );
      });
    });
  });

})




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
