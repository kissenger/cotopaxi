const p2p = require('./geoLib.js').p2p;
// const p2l = require('./geoLib.js').p2l;
const Point = require('./_Point.js').Point;
const boundingBox = require('./geoLib').boundingBox;
const bearing = require('./geoLib.js').bearing;
const timeStamp = require('./utils.js').timeStamp;
const simplify = require('./geoLib.js').simplify;
const upsAndDowns = require('./upsAndDowns.js').upsAndDowns;
const DEBUG = false;

const LONG_PATH_THRESHOLD = 2000;  // number of points (before simplification) above which the path will be treated as long
const SIMPIFY_TOLERANCE = 4;
const MATCH_DISTANCE = 100;

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

    if (DEBUG) { console.log(timeStamp() + ' >> Creating a new Path instance '); }

    // populate the class variables that can be populated before simplifying (if a route)
    this.elevs = elevs;
    this.pathType = pathType;
    this.points = this.getPoints(lngLat, elevs); // elevations need to be put on the points array so thay the correct eevations are deleted when simplifying
    this.isElevations = this.elevs.length > 0 ? true : false;
    this.isTime = false;

    // auto simplify a route - user does not get a choice
    if (DEBUG) { console.log(timeStamp() + ' >> Started with  ' + this.points.length + ' points and ' + this.elevs.length + ' elevations' ); }
    if (this.pathType === 'route') {
      this.points = simplify(this.points, SIMPIFY_TOLERANCE);
      // this is a bit awkward - better if we dont need to keep an elevs array as well as points array ...?
      // map doesnt work beacuse it creates an array the same length as the points array, which screw up some stuff below
      this.elev = [];
      this.points.forEach(point => {
        if (point.elev) { this.elev.push(point.elev); }
      })
    }

    // update remaining class variables after simplification
    this.cumDistance = this.getCumDistance();    // cumulative distance array on the class avoids having to recalculate distances when pathStats() is called multiple times
    this.isLong = this.points.length > LONG_PATH_THRESHOLD ? true : false;
    this.bbox = boundingBox(this.points);
    this.matchedPoints = this.getMatchedPoints();
    this.category = this.getCategory();
    this.stats = this.getPathStats(); // called again from getElevations() but unavoidable
    this.direction = this.getDirection();
}

  /**
   * Determines whether or not elevations are desired, and if so whether we have them, and if not goes and gets them
   */
  getElevations() {

    if (DEBUG) { console.log(timeStamp() + ' >> Getting elevations'); }
    return new Promise((resolve, reject) => {

      // if the path is not 'long', and we dont have the same number of elevs (could be none) as points
      if (!this.isLong && this.points.length !== this.elevs.length) {

        const options = {interpolate: true, writeResultsToFile: false };
        upsAndDowns(this.points.slice(this.elevs.length, this.points.length), options).then( (newElevs) => {
          if (DEBUG) { console.log(timeStamp() + ' >> Got ' + newElevs.length + ' new elevations.'); }
          this.elevs = this.elevs.concat(newElevs.map(e => e.elev));
          this.elevs = this.getFilteredElevations(this.elevs);
          this.isElevations = true;           // must set before getting stats or elevs wont be calculated
          this.stats = this.getPathStats();
          resolve();
        }).catch( () => {
          reject(new Error('Error getting elevations'))
        })

      // if the path is long (checking that the path is a route) or we have the right number of elevs
      } else {
        // its a long route so whatever happens, discard the elevations
        if (this.isLong) {
          this.elevs = [];
          this.isElevations = false;
        // its a track so keep elevations if they are present.
        // completeness of supplied elevations is not checked, although there is a check in readGPX()
        } else {
          if (this.pathType === 'route') {
            this.isElevations = this.elevs.length !== 0 ? true : false;
          }
        }
        resolve();
      }
    })

  }

  /**
   * Apply low pass filter to elevation data
   * @param {} elevs elevations as an array of numbers
   */
  getFilteredElevations(elevs) {
    const ALPHA = 0.35;
    const smoothedElevs = [elevs[0]];
    for (let i = 1, max = elevs.length; i < max; i++) {
      smoothedElevs.push( elevs[i] * ALPHA + smoothedElevs[i-1] * ( 1 - ALPHA ) );
    }
    return smoothedElevs;
  }


  /**
   * Calculates cumalative distance array
   */
  getCumDistance() {
    let dist = 0;
    let cumDist = [0];
    for (let i = 1, iMax = this.points.length; i < iMax; i++) {
      dist += p2p(this.points[i], this.points[i-1]);;
      cumDist.push(dist);
    }
    return cumDist;
  }


  /**
   * Converts all parameters into an array of Point instances for ease of processing
   * @param {*} coords lngLat array in [lng, lat] formay
   * @param {*} elev array of numbers - if not the same length as coords then will fill the first x points
   */
  getPoints(coords, elev) {

    let pointsArray = [];
    for (let i = 0, n = coords.length; i < n; i++) {
      let thisPoint = [];
      if ( coords ) thisPoint.push(coords[i]);
      if ( elev && elev[i] ) {
        thisPoint.push(elev[i])};
      pointsArray.push(new Point(thisPoint));
    }

    return pointsArray;
  }

  // /**
  //  * NOT USED
  //  * Add elevations to an array of points
  //  * @param {*} p
  //  * @param {*} e
  //  */
  // addElevationsToPointsArray(p, e) {
  //   // if (p.length !== e.length ) { return p }
  //   let pointsArray = [];
  //   for (let i = 0, n = p.length; i < n; i++) {
  //     p[i].addElevation(e[i]);
  //     pointsArray.push(p[i]);
  //   }
  //   return pointsArray;
  // }


  /**
   * Categorises the path based on shape (circular, out-and-back, etc)
   * Principal is to find the number of points on the route that are 'coincident', i.e.
   * if a point on the way out is close to a point on the way back
   * - Circular
   *     1/ starts and ends at the same point
   *     2/ has few coincident points (n < PC_THRESH_LOW)
   * - Out and back
   *     1/ shares lots of coincident points (n > PC_THRESH_HIGH)
   *     NOTE does not need to start and end at the same place
   * - One way
   *     1/ does not start and end at the same place
   *     2/ has few coincident points (n < PC_THRESH_LOW)
   * - Hybrid
   *     Does really match any of the above - uncategorisable
   *
   */
  getCategory() {

    //

    if (DEBUG) { console.log(timeStamp() + ' >> Get category of Path '); }

    const START_AT_END_THRESH = 250;  // distance in metres, if start and end points are this close then consider as matching
    const PC_THRESH_UPP = 90;        // if % shared points > PC_THRESH_UPP then consider as 'out and back' route
    const PC_THRESH_LOW = 10;        // if % shared points < PC_THRESH_LOW the consider as 'one way' or 'circular' depending on whether start is returned toKs

    const pcShared = this.matchedPoints.length / this.points.length * 100 * 2;  //(x2 becasue only a max 1/2 of points can be matched)
    const isStartAtEnd = p2p(this.points[0], this.points[this.points.length - 1]) < (START_AT_END_THRESH);

    // console.log(nm, this.points.length, pcShared, isStartAtEnd);
    // console.log(matchPairs);

    if ( pcShared > PC_THRESH_UPP ) { return 'Out and back'; }
    if ( isStartAtEnd && pcShared < PC_THRESH_LOW ) { return 'Circular'; }
    if ( !isStartAtEnd && pcShared > PC_THRESH_UPP ) { return 'Out and back'; }
    if ( !isStartAtEnd && pcShared < PC_THRESH_LOW ) { return 'One way'; }

    // if nothing else fits then call it a hybrid
    return 'Hybrid';

  }


  /**
   * Returns an array of matched point pairs, useful for route categorisation but also sent to front end for debugging
   */
  getMatchedPoints() {

    if (DEBUG) { console.log(timeStamp() + ' >> Get mtached points '); }

    /**
     * match distance should be greater than the average distance between points
     */

    // const MATCH_DISTANCE = 100;       // distance in metres, if points are this close then consider as matching
    const BUFFER = 100;   // number of points ahead to skip when finding match (to avoid matching point in the same direction)
    const mp = [];

    for ( let i = 0; i < this.points.length; i++ ) {  // look at each point
      for ( let j = i + BUFFER; j < this.points.length; j++ ) {  // look at each point ahead of it

        const dist = p2p(this.points[i], this.points[j]);  // get distance btwn points i and j

        if ( dist < MATCH_DISTANCE ) {
          mp.push([i, j]);
          break;

        // if dist is a high number, skip some points as we know the next point is not going to be a match also
        // number of points to skip is the calculated distance over the threshold
        } else if ( dist > MATCH_DISTANCE * 10 ) {
          // j += Math.round(0.8*dist / MATCH_DISTANCE);
        }
      }
    }

    return mp;

  }


  /**
   * Determines the direction of the path
   * - Circular Route:
   *   Works by calculating the bearing from the successive points on route and determining
   *   if this bearing is more often increasing (clockwise) or decreasing (anti-clockwise)
   * - One Way Route:
   *  Simply takes the bearing from the first to last point and converts this into a direction
   * - Hybrid / Out and back:
   *  Direction is meaningless --> returns empty string ""
   */
  getDirection() {

    if (DEBUG) { console.log(timeStamp() + ' >> getDirection '); }

    if ( this.category === 'Circular' ) {

      // cwSum is incremented if current bearing > last bearing, or decremented if <
      // the direction of the path is determine on whether the final brgShift is +ve or -ve
      let cwSum = 0;
      const n = Math.ceil(this.points.length / 20);    // only sample the nth point
      let lastBrg;

      for ( let i = 1; i < this.points.length; i += n ) {

        const thisBrg = bearing(this.points[i-1], this.points[i]);
        if (i !== 1) {
          const deltaBrg = thisBrg - lastBrg;
          if (Math.abs(deltaBrg) < Math.PI) {    // ignore point if delta is > 180deg (assume moved across 0degs)
            cwSum += Math.sign(deltaBrg);        // increment if bearing is increasing, decrement if decreasing
          }
        }

        lastBrg = thisBrg;
      }

      if ( cwSum > 0 )   { return 'Clockwise'; }
      if ( cwSum < 0 )   { return 'Anti-Clockwise'; }
      if ( cwSum === 0 ) { return 'Unknown Direction'; }


    } else if ( this.category === 'One way' ) {

      const thisBrg = bearing(this.points[0], this.points[this.points.length - 1]);

      if (thisBrg > 5.890 || thisBrg <= 0.393) { return 'South to North'; }
      if (thisBrg > 0.393 && thisBrg <= 1.178) { return 'South-West to North-East'; }
      if (thisBrg > 1.178 && thisBrg <= 1.963) { return 'West to East'; }
      if (thisBrg > 1.963 && thisBrg <= 2.749) { return 'North-West to South-East'; }
      if (thisBrg > 2.749 && thisBrg <= 3.534) { return 'North to South'; }
      if (thisBrg > 3.534 && thisBrg <= 4.320) { return 'North-East to South West'; }
      if (thisBrg > 4.320 && thisBrg <= 5.105) { return 'East to West'; }
      if (thisBrg > 5.105 && thisBrg <= 5.890) { return 'South-East to North-West'; }

    } else {

      return '';

    }
  }


  /**
   * Create path statistics and parameters
   */
  getPathStats() {

    if (DEBUG) { console.log(timeStamp() + ' >> Analyse Path '); }

    const GRAD_THRESHOLD = 3;      // gradient in % above which is considered a climb/descent
    const HILL_THRESHOLD = 20;     // hills of less height gain will not be considered

    // const KM_TO_MILE = 0.6213711922;
    // const SPEED_THRESHOLD = 1.4;   // km/h
    // const ASCENT_THRESHOLD = 15;   // threshold below which changes in ascent/descent are ignored

    // distances
    let dDist = 0;
    let maxDist = 0;
    let p2pMax = 0;

    // times
    // let movingTime = 0;
    // let movingDist = 0;
    // let duration = 0;
    // let lastKmStartTime = 0;        // time at which previous km marker was reached
    // let lastMileStartTime = 0;      // time at which previous mile marker was reached
    // let lastKmStartDist = 0;        // distance of the point after the last round km
    // let lastMileStartDist = 0;      // distance of the point after the last round mile
    // let kmSplits = [];              // array containing location of km markers and pace splits
    // let mileSplits = [];            // array containing location of mile markers and pace splits

    // elevations
    let dElev;                      // change in elevation from previous loop
    let deltaSum = 0;               // cumulative change in elevation
    let ascent = 0;
    let descent = 0;
    let maxElev = -9999;
    let minElev = 9999;

    // hills and gradients local variables
    let lastSlopeType;
    let thisSlopeType;              // 0 = flat, 1 = ascending, -1 = descending
    // let elevDist = 0;               // cumulative distance over which elevation is unchanged, used for gradient calc
    let hills = [];                 // array cotaining identified hills
    let maxGradient;                // maxGradient over the whole path
    let gradient;
    let d0 = 0;                     // distance at the start of a hill
    let t0 = 0;                     // time at the start of a hill
    let e0 = 0;                     //  elevation at the start of a hill
    let p0 = 0;                     // point number at which hill begins

    for (let index = 1; index < this.points.length; index++ ) {

      /**
       * Distance
       * cumdistance
       */
      dDist = this.cumDistance[index] - this.cumDistance[index-1];
      p2pMax = dDist > maxDist ? dDist : maxDist;

      /**
       * Moving Time
       * Compare speed between previous point and this, against threshold.
       * Eliminate data points below threshold
       * Output: new array with indexes of saved points
       * NOT RUN FOR ROUTE AS LACKING ANY TIME INFORMATION
       */
      // if ( isTime ) {

      //   // track moving time and distance
      //   if ((dDist / 1000) / (thisPoint.time / 3600) > SPEED_THRESHOLD ) {
      //     movingTime += thisPoint.time;
      //     movingDist += dDist;
      //   }
      //   // total time to this point
      //   duration += thisPoint.time;

      // }

      /**
      * Mile and KM splits
      * Create new arrays containing point number at milestone, and pace for last segment
      * TODO: take this into distance function and only find splits here?  avoids duplication
      */
      // if ( this.cumDistance[index] / (1000 * (kmSplits.length + 1)) >= 1 || index === this.pathSize) {
      //   // first point past finished km
      //   if ( isTime ) {
      //     var dt = (duration - lastKmStartTime) / 60;     //time in mins
      //     var dd = (this.cumDistance[index] - lastKmStartDist) / 1000;
      //   }
      //   kmSplits.push([index, isTime ? dt/dd : 0]);
      //   lastKmStartTime = duration;
      //   lastKmStartDist = this.cumDistance[index];
      // }
      // if ( this.cumDistance[index] * KM_TO_MILE / (1000 * (mileSplits.length + 1)) >= 1 || index === this.pathSize) {
      //   if ( isTime ) {
      //     var dt = (duration - lastMileStartTime) / 60;
      //     var dd = (this.cumDistance[index] - lastMileStartDist) / 1000 * KM_TO_MILE;
      //   }
      //   mileSplits.push([index, isTime ? dt/dd : 0]);
      //   lastMileStartTime = duration;
      //   lastMileStartDist = this.cumDistance[index];
      // }

      /**
      * Elevation tracking and analyse gradient and hills
      * Count cumulative elevation gain/drop
      * Gradient and slope type
      */
      if ( this.isElevations ) {

        dElev = this.elevs[index] - this.elevs[index-1];
        maxElev = this.elevs[index] > maxElev ? this.elevs[index] : maxElev;
        minElev = this.elevs[index] < minElev ? this.elevs[index] : minElev;

        /**
         * calculate the ascent/descent stats using a threshold below which increments are neglected
         */

        // if we are still going in the same direction as last time, then increment deltaSum
        if (Math.sign(deltaSum) === Math.sign(dElev)) {
          deltaSum += dElev;

        // if we we have changed direction then increment ascent/descent only if last movement was > threshold
        } else {

          if (Math.abs(deltaSum) > HILL_THRESHOLD) {
            if (deltaSum > 0) {
              ascent += deltaSum;
            } else {
              descent += deltaSum;
            }
          }
          deltaSum = dElev;
        }

        /**
         * use a gradient threshold, below which consider to be on the flat, above which calculate hill stats
         * where a hill starts/stops is determined by GRAD_THRESHOLD
         * Whether a hill is registered as significant is determined by HILL_THRESHOLD (which will also affect ascent/descent calcs)
         */
        const GRAD_ALPHA = 0.35;

        // determine type of slope based on gradient
        // elevDist += dDist / 1000.0;
        let thisGrad = (this.elevs[index] - this.elevs[index-1]) / dDist * 100;   // factor of 10  = * 100 (for %) / 1000 (for km->m)

        // smooth gradient using LP filter
        if (index === 1) { gradient = thisGrad }
        else { gradient = ( thisGrad * GRAD_ALPHA + gradient * ( 1 - GRAD_ALPHA ) ); }



        // determine slope type
        if ( gradient < (-GRAD_THRESHOLD) ) { thisSlopeType = -1; }
        else if ( gradient > GRAD_THRESHOLD ) { thisSlopeType = 1; }
        else { thisSlopeType = 0; };

        // max gradient; gets reset if slopetype changes
        maxGradient = Math.abs(gradient) > maxGradient ? Math.abs(gradient) : maxGradient;
        // elevDist = 0;   // reset distance each time elevation changes

        /**
         * calculate hills array
         */
        // console.log(index, this.cumDistance[index], this.elevs[index], thisGrad, gradient, thisSlopeType, lastSlopeType);
        if ( typeof lastSlopeType === 'undefined' ) {
          // slopeType has not been initialised: do so
          lastSlopeType = thisSlopeType;
          e0 = this.elevs[index];
          maxGradient = 0;

        } else {
          // slopeType exists

          if ( (thisSlopeType !== lastSlopeType && lastSlopeType !== 0) || index === this.points.length) {

            // slopetype has changed, determine delta between this point and the start of the hill
            const de = this.elevs[index] - e0;
            const dd = this.cumDistance[index] - d0;
            const gradAve = de / dd * 100 ;

            // if its greater than the threshold, mark as a hill
            if ( Math.abs(de) > HILL_THRESHOLD && Math.abs(gradAve) > GRAD_THRESHOLD) {

              // const dd = this.cumDistance[index] - d0;
              // const dt = (duration - t0);

              hills.push({
                dHeight: de,
                dDist: dd,
                startDist: d0,
                startPoint: p0,
                endPoint: index,
                dTime: this.isTime ? dt : 0,
                pace: this.isTime ? (dt/60)/(dd/1000) : 0,
                ascRate: this.isTime ? de/(dt/60) : 0,
                maxGrad: lastSlopeType === 1 ? maxGradient : -maxGradient,
                aveGrad: gradAve
              });
              // console.log(hills[hills.length-1])
            }

            p0 = index;
            d0 = this.cumDistance[index];
            // t0 = duration;
            e0 = this.elevs[index];
            maxGradient = 0;

          }
          lastSlopeType = thisSlopeType;
        } //if ( typeof lastSlopeType === 'undefined' ) {
      } //if (this.isElevations) {
    } //loop


    if (DEBUG) { console.log(timeStamp() + ' >> Analyse Path Finished'); }

    return{
      duration: this.isTime ? duration: 0,
      bbox: this.bbox,
      distance: this.cumDistance[this.points.length - 1],
      cumDistance: this.cumDistance,
      nPoints: this.points.length,
      pace: this.isTime ? (duration/60) / (this.cumDistance[this.points.length - 1]/1000) : 0,
      movingStats: {
        movingTime: this.isTime ? movingTime : 0,
        movingDist: this.isTime ? movingDist : 0,
        movingPace: this.isTime ? (movingDist/60) / (movingDist/1000) : 0,
      },
      elevations: {
        ascent: ascent,
        descent: descent,
        maxElev: maxElev,
        minElev: minElev,
        lumpiness: (ascent - descent) / this.cumDistance[this.points.length - 1],
      },
      hills: hills,
      splits: {
        kmSplits: this.isTime ? kmSplits : [],
        mileSplits: this.isTime ? mileSplits : []
      },
      p2p: {
        max: p2pMax,
        ave: this.cumDistance[this.points.length - 1] / this.points.length
      }
    }
  }

  /**
   * returns a geoJSON object of the class instance
   */

  asGeoJSON() {

    return  {
      "type": "FeatureCollection",
      "features": [{
        "type": "Feature",
        "geometry": {
            "type": "LineString",
            "coordinates": this.points.map( c => [c.lng, c.lat])
        },
        "properties": {
            "params": {
                "elev": this.elevs,
                "cumDistance": this.cumDistance
            },
            "stats": this.stats,
            "info": {
                "name": "",
                "description": "",
                "isLong": this.isLong,
                "isElevations": this.isElevations,
                "category": this.category,
                // "direction": this.directiom,
                "pathType": this.pathType
            }
        }
      }]
    }
  }

  
  /**
   * Returns object in format for insertion into MongoDB - nothing is calculated afresh, it just assembles existing data into the
   * desired format
   * @param {string} userId
   * @param {boolean} isSaved
   * // TODO change this to property of the class, not a method. Neater but need byRef?
   */
  asMongoObject(userId, isSaved) {

    if (DEBUG) { console.log(timeStamp() + ' >> Assemble Mongo Object '); }

    const params = {};
    if (this.time) params.time = this.time;
    if (this.elevs) params.elev = this.elevs;
    if (this.heartRate) params.heartRate = this.heartRate;
    if (this.cadence) params.cadence = this.cadence;
    params.cumDistance = this.stats.cumDistance;
    params.matchedPoints = this.matchedPoints;

    return {
      userId: userId,
      isSaved: isSaved,
      geometry: {
        type: 'LineString',
        coordinates: this.points.map( x => [x.lng, x.lat])
      },
      info: {
        // direction: this.direction(),
        direction: this.direction,
        category: this.category,
        isFavourite: false,
        isNationalTrail: false,
        name: this.name,
        description: this.description,
        pathType: this.pathType,
        startTime: this.startTime,
        isLong: this.isLong,
        isElevations: this.isElevations
      },
      params: params,
      stats: this.stats,
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
