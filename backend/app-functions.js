
"use strict"

/**
 * Module provides abstractions for the 'app' module
 */

import { Route } from './class-path.js';
import { writeGPX } from './gpx.js';
import { debugMsg } from './debugging.js';
import { Routes, Tracks } from './models/path-models.js';


/**
* returns the desired mongo model object
*/
export function mongoModel(pathType) {
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
export function getPathDocFromId(pid, ptype, uid) {

  return new Promise( (resolve, reject) => {
    mongoModel(ptype)
      .find( {_id: pid, userId: uid} )
      .then( path => resolve(path[0]) )
      .catch( error => reject(error) )
  })
}


/**
* Abstract model creation
*/
export function createMongoModel(pathType, model) {
  return new Promise( (resolve, reject) => {
    mongoModel(pathType).create(model)
      .then( doc => resolve(doc) )
      .catch( error => reject(error))
  });
}



/**
 * Converts standard bounding box to polygon for mongo geometry query
 * bbox bounding box as [minlng, minlat, maxlng, maxlat]
 */
export function bbox2Polygon(bbox) {
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
export function getListData(docs, count) {

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
    count
    })
  );

}


export function documentToGpx(document) {

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
