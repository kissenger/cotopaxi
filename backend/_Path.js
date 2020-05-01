const PointsList = require('./_Point.js').PointsList;
// const upsAndDowns = require('./upsAndDowns').upsAndDowns;
const debugMsg = require('./utils').debugMsg;
const jael = require('jael');
const globals = require('./globals');
jael.setPath(globals.PATH_TO_GEOTIFFS);

/**
 * Path Class
 * Use where data specific to a route/track is not of interest (eg simplification)
 * Otherwise use Route and Track classes, which extend the Path class
 * @param {*} lngLat array of [lng, lat] coordinates
 * @param {*} elevs array of elevations
 * @param {*} pathType string 'route' or 'track'
 */



class Path  {

  constructor(lngLat, elevs, pathType) {

    debugMsg('Create new Path');

    this.lngLat = lngLat;
    this.elevs = elevs;     // note that if elevs are not provided, elevations are not on the class until init() is run
    this.pathType = pathType;

  }

  /**
   * Initalise the object
   */
  init() {

    debugMsg('Path.init()');

    // if the number of points is below LONG_PATH_THRESHOLD and we were not supplied with elevations,
    // then go get them
    return new Promise( (resolve, reject) => {

      // instantiate the pointsList without elevations so we can simplify if needed before getting elevations
      // note elevations are provided in the instantiation so if they were provided then theyll be simplified too
      this.pointsList = new PointsList(this.lngLat, this.elevs);

      // remember to update the class variables in case there was any simplification (2 hrs lost debugging this)
      if (!this.pointsList.isLong && this.elevs.length === 0) {
        const req = {points: this.pointsList.lngLats().map( pt => ({lng: pt[0], lat: pt[1]}) ) };
        jael.getElevs(req)
          .then(elevs => {
            this.pointsList.addElevations(elevs.map(e => e.elev));
            resolve();
          })
          .catch(e => reject(e) );
      } else {
        resolve();
      }
    })

  }


  /**
   * Returns object in format for insertion into MongoDB - nothing is calculated afresh, it just assembles existing data into the
   * desired format
   * @param {string} userId
   * @param {boolean} isSaved entries with boolean false get flushed periodically, so set to true to ensure saved
   */
  asMongoObject(userId, isSaved) {
    debugMsg('Convert Path to Mongo Object');

    return {
      userId: userId,
      isSaved: isSaved,
      geometry: {
        type: 'LineString',
        coordinates: this.pointsList.lngLats()
      },
      params: this.pointsList.getParams(),
      stats: this.pointsList.getStats(),
      info: {
        ...this.pointsList.getInfo(),
        pathType: this.pathType,
        name: this.name,
        description: this.description
      }
    }
  }

} // end of Path Class

/**
 * Track Class
 * Invokes Path class ensuring that any track params are captured (time, HR, cadence etc)
 */
class Track extends Path {
  constructor(name, description, lngLat, elev, time, heartRate, cadence){

    super(lngLat, elev, 'track');

    // this.pathType = 'track';
    this.name = name;
    this.description = description;

    if (heartRate) this.heartRate = heartRate;
    if (cadence) this.cadence = cadence;
    if (time) {
      if (typeof time[0] === 'string') {

        // have recieved array of timestamps - convert to increments in seconds
        this.startTime = time[0];
        this.time = time.map( (t, i, a) => {
          return i===0 ? 0 : (new Date(t) / 1000) - (new Date(a[i-1]) / 1000)
        });

      } else {

        // have recieved array of increments - use as-is
        this.time = time;

      }
    }
  }
}

/**
 * Route class
 * Ignores any parameters except name, desc, coord and elev
 * Calls simplify on all paths in order to minimise order of matching algorithm
 */
class Route extends Path {
  constructor(name, description, lngLat, elev){

    super(lngLat, elev, 'route');
    this.name = name;
    this.description = description;

  }
}

module.exports = {
  Path, Track, Route
};

