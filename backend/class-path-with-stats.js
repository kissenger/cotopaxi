"use strict"

/**
 * Extends geo-points-and-paths Path class to provide application specific data
 * handling and processing
 */

import { debugMsg } from './utilities.js';
import * as globals from './globals.js';
import { getCategory, getDirection, getMatchedPoints, analyseElevations } from './analyse-path-funcs.js';
import geolib from 'geo-points-and-paths';
const {Point, Path, geoFunctions} = geolib;



export class PathWithStats extends Path{

  constructor(name, description, coords, elevs) {

    debugMsg('PathWithStats');

    super(coords);

    if (elevs.length > 0) {
      this.addParamToPoints(elev);
      this._isElevations = true;
    } else {
      this._isElevations = false;
    }

    this.simplify(2);
    this._name = name;
    this._description = description;
    this._isLong = this.length > globals.LONG_PATH_THRESHOLD;
    this._distanceData = this.getDistanceData;  // this needs to be available on the path before analyse elevations is called
    this._elevationData = analyseElevations.apply(this);
    this._matchedPoints = getMatchedPoints.apply(this);

  }

  get info() {
    return {
      pathType: this._pathType,
      name: this._name,
      description: this._description,
      isLong: this._isLong,
      isElevations: this._isElevations,
      category: getCategory.apply(this),
      direction: getDirection.apply(this)
    }
  }


  get stats() {

    stats = {
      ...this._distanceData,
      ...this._elevationData,
      bbox: this.boundingBox,
      nPoints: this.length,
      simplificationRatio: this.simplificationRatio,
    };

    delete stats.smoothedElev;   // this belongs on the param array

    return stats;
  }


  get params() {

    let params = {
      matchedPoints: this._matchedPoints,
      cumDistance: this.cumDistance,
    };

    if (this._isElevations) {
      params.smoothedElev = this._elevationData.smoothedElev;
      params.elev = this.getParamFromPoints(elevs);
    }

    return params;
  }


  get distanceData() {

    const deltaDistance = this.deltaDistance;
    return{
      distance: this.distance,
      dDistance: deltaDistance,
      nPoints: this.length,
      p2p: {
        max: Math.max(...deltaDistance),
        ave: deltaDistance.reduce( (a, b) => a+b, 0) / this.length
      }
    }

  }


  asMongoObject(userId, isSaved) {
    return {
      userId: userId,
      isSaved: isSaved,
      geometry: {
        type: 'LineString',
        coordinates: this.lngLats
      },
      params: this.params,
      stats: this.stats,
      info: this.info
    }
  }

}


export class Route extends PathWithStats {
  constructor(name, description, lngLat, elev){
    super(name, description, lngLat, elev);
    this._pathType = 'route';
  }


}






