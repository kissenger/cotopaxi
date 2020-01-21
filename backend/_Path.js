const p2p = require('./geoLib.js').p2p;
// const p2l = require('./geoLib.js').p2l;
const Point = require('./_Point.js').Point;
const boundingBox = require('./geoLib').boundingBox;
const bearing = require('./geoLib.js').bearing;
const timeStamp = require('./utils.js').timeStamp;
const simplify = require('./geoLib.js').simplify;
const upsAndDowns = require('./upsAndDowns.js').upsAndDowns;
const DEBUG = true;
const LONG_PATH_THRESHOLD = 2000;  // number of points (before simplification) above which the path will be treated as long

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

    // populate class variables
    this.elevs = elevs;
    this.pathType = pathType;
    this.points = this.getPoints(lngLat);
    this.isLong = this.points.length > LONG_PATH_THRESHOLD ? true : false;
    this.isElevations = false; // assume that elevations do not exist until the getElevations function has been called

    // auto simplify a route - user does not get a choice
    if (this.pathType === 'route') { 
      this.points = simplify(this.points); 
    }

    // update remaining class variables after simplification
    this.bbox = boundingBox(this.points);
    this.pathSize = this.points.length - 1;
    this.category = this.category();
    this.stats = this.getPathStats(); //effectively called again from getElevations() but unavoidable 
}

  /**
   * 
   */
  getElevations() {

    return new Promise((resolve, reject) => {

      // if the path is not 'long' and elevs do not already exist, then we want elevations
      if (!this.isLong && this.elevs.length === 0) {
        const options = {interpolate: false, writeResultsToFile: false };
        upsAndDowns(this.points, options).then( (newElevs) => {
          this.elevs = this.smoothElevations(newElevs.map(e => e.elev));
          this.points = this.addElevationsToPointsArray(this.points, this.elevs);
          this.stats = this.getPathStats();
          this.isElevations = true;
          resolve();
        })

      // if the path is long (checking that the path is a route), then we want to remove elevations if we have them and return nothing
      } else {
        // its a long route so whatever happens, discard the elevations
        if (this.pathType = 'route') {
          this.elevs = [];
          this.isElevations = false
        // its a track so keep elevations if they are present.
        // completeness of supplied elevations is not checked, although there is a check in readGPX()
        } else {
          this.isElevations = this.elevs.length !== 0 ? true : false
        }
        resolve();
      }
    })

  }

  /**
   * Apply low pass filter to elevation data
   * @param {} elevs elevations as an array of numbers
   */
  smoothElevations(elevs) {
    const ALPHA = 0.1;
    const smoothedElevs = [elevs[0]];
    for (let i = 1, max = elevs.length - 1; i < max; i++) {
      smoothedElevs.push( elevs[i] * ALPHA + smoothedElevs[i-1] * ( 1 - ALPHA ) );
    }
    return smoothedElevs;
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

    return {
      userId: userId,
      isSaved: isSaved,
      geometry: {
        type: 'LineString',
        coordinates: this.points.map( x => [x.lng, x.lat])
      },
      info: {
        // direction: this.direction,
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


  /**
   * Returns point class for node of given index
   * @param {number} index
   * TODO: this is a shit way of doing things ... every time you want to look at a point youre converting it to an object, and
   * we loop through the coords array loads of times so this is being done lots and then discarded. Why not convert to a Point
   * in the constructor when the Class is instantiated???
   */
  getPoints(coords, elev, time, heartRate, cadence) {

    let pointsArray = [];
    for (let i = 0, n = coords.length; i < n; i++) {
      let thisPoint = [];
      if ( coords ) thisPoint.push(coords[i]);
      if ( elev ) thisPoint.push(elev[i]);
      if ( time ) thisPoint.push(time[i]);
      if ( heartRate ) thisPoint.push(heartRate[i]);
      if ( cadence ) thisPoint.push(cadence[i]);  
      pointsArray.push(new Point(thisPoint));
    }
      
    return pointsArray;
  }

  /**
   * Add elevations to an array of points
   * @param {*} p 
   * @param {*} e 
   */
  addElevationsToPointsArray(p, e) {
    // if (p.length !== e.length ) { return p }
    let pointsArray = [];
    for (let i = 0, n = p.length; i < n; i++) {
      p[i].addElevation(e[i]);
      pointsArray.push(p[i]);
    }
    return pointsArray;
  }


  /**
   * Categorises the path based on shape (circular, out-and-back, etc)
   *
   */
  category() {

    if (DEBUG) { console.log(timeStamp() + ' >> Get category of Path '); }

    const MATCH_DISTANCE = 25;   // in m, if points are this close then consider as coincident
    const BUFFER = 50;           // number of points ahead to skip in matching algorithm
    const PC_THRESH_UPP = 90;    // if % shared points > PC_THRESH_UPP then consider as 'out and back' route
    const PC_THRESH_LOW = 10;    // if % shared points < PC_THRESH_LOW the consider as 'one way' or 'circular' depending on whether start is returned toKs

    // loop through points and match each point against remaining points in path; count matches
    // also calculate average lat/long for later use
    let nm = 0;
    for ( let i = 0; i < this.pathSize - BUFFER; i++ ) {
      for ( let j = i + BUFFER; j < this.pathSize; j++ ) {
        const dist = p2p(this.points[i], this.points[j]);

        // if dist between nodes is below threshold then count the match and break loop
        if ( dist < MATCH_DISTANCE ) {
          nm++;
          break;

        // if dist is a high number, skip some points as we know the next point is not going to be a match also
        } else if ( dist > MATCH_DISTANCE * 10 ) {
          j += Math.round(dist / MATCH_DISTANCE);
        }
      }
    }

    this.bbox
    // caculate proportion of points that are matched ( x2 becasue only a max 1/2 of points can be matched)
    const pcShared = nm / this.pathSize * 100 * 2;
    if ( p2p(this.points[0], this.points[this.pathSize]) < MATCH_DISTANCE * 10 ) {
      // path ends where it started, within tolerance

      if ( pcShared > PC_THRESH_UPP ) return 'Out and back'
      else if (pcShared < PC_THRESH_LOW ) return 'Circular'
      else return 'Hybrid'

    } else {
      // path did not end where it started

      if ( pcShared > PC_THRESH_UPP ) return 'Out and back'
      else if (pcShared < PC_THRESH_LOW ) return 'One way'
      else return 'Hybrid'

    }
  }


  /**
   * Determines the direction of the path
   * Currently only determines 'clockwise' or 'anticlockwise' for circular route
   * TODO - not used as not working for short paths, needs reviewing
   */
  direction() {

    if (DEBUG) { console.log(timeStamp() + ' >> Get Path direction '); }

    const RANGE_TOL = 0.5 * Math.PI;   // in m, if points are this close then consider as coincident

    if ( this.category === 'Circular' || this.category === 'One way') {

      const startPoint = this.points[0];
      const stepSize = parseInt(this.pathSize/20);
      let brgShift = 0;
      let minBrg = 20;
      let maxBrg = -20;
      let cwSum = 0;
      let lastBrg;

      for ( let i = 1; i < this.pathSize; i+= stepSize ) {
        let thisBrg = bearing(startPoint, this.points[0]);

        if (i !== 1) {
          let deltaBrg = thisBrg - lastBrg;

          // if the change in bearing is greater than 90degs then suspect have moved across 0degs - correct bearing
          if (deltaBrg > 0.5*Math.PI) { brgShift-- };
          if (deltaBrg < -0.5*Math.PI) { brgShift++ };
          thisBrg += brgShift * 2 * Math.PI;
          deltaBrg = thisBrg - lastBrg;

          // update max and min bearing
          maxBrg = thisBrg > maxBrg ? thisBrg : maxBrg;
          minBrg = thisBrg < minBrg ? thisBrg : minBrg;

          // increment/decrement counters depending on change in bearing
          if (deltaBrg < 0) {
            cwSum++;
          } else {
            cwSum--;
          }
          // console.log(cwSum, thisBrg, minBrg, maxBrg, deltaBrg, maxBrg - minBrg);
        }

        lastBrg = thisBrg;

      }

      // return
      if (maxBrg - minBrg < RANGE_TOL) return ''
      else {
        if ( cwSum > 0 ) return 'Anti-clockwise'
        else return 'Clockwise'
        }
      }

    }


      // // path is circular, now determine direction
      // let lastBrg = 0;
      // let delta = 0;
      // let deltaSum = 0;
      // let midPoint = new Point([(this.bbox[2]-this.bbox[0])/2, (this.bbox[3]-this.bbox[1])/2]);
      // for ( let i = 0; i < this.pathSize; i+=10 ) {
      //   const brg = bearing(midPoint, this.getPoint(i));
      //   if (i !== 0 && delta < 3.14) {
      //     delta = brg - lastBrg;
      //     deltaSum += delta;
      //   }
      //   lastBrg = brg;
      // }
      // if (deltaSum > 0) {
      //   return 'Anticlockwise'
      // } else {
      //   return 'Clockwise'
      // }

  /**
   * Create path statistics and parameters
   */
  getPathStats() {

    if (DEBUG) { console.log(timeStamp() + ' >> Analyse Path '); }

    const KM_TO_MILE = 0.6213711922;
    // const ALPHA = 0.3;             //low pass filter constant, to higher the number the quicker the response, used for smoothing gradient
    const GRAD_THRESHOLD = 2;      // gradient in % above which is considered a climb/descent
    const HILL_THRESHOLD = 20;     // hills of less height gain will not be considered
    const SPEED_THRESHOLD = 1.4;   // km/h
    const ASCENT_THRESHOLD = 15;   // threshold below which changes in ascent/descent are ignored  

    let maxDist = 0;
    let p2pMax = 0;

    // increments from last point
    let dDist = 0;

    // cumulative counters
    let distance = 0;
    let deltaSum = 0; // cumulative change in elevation 
    let ascent = 0;
    let descent = 0;
    let maxElev = -9999;
    let minElev = 9999;
    let movingTime = 0;
    let movingDist = 0;
    let duration = 0;
    let cumDistance = [0];  // cumulative distance at each point

    // this and last point values
    let thisElev; // needs to be undefined as its checked
    let lastElev;
    let delta; // change in elevation from previous loop
    let lastSlopeType;
    let thisSlopeType;              // 0 = flat, 1 = ascending, -1 = descending
    let lastKmStartTime = 0;        // time at which previous km marker was reached
    let lastMileStartTime = 0;      // time at which previous mile marker was reached
    let lastKmStartDist = 0;
    let lastMileStartDist = 0;

    // hills and gradients local variables
    let eDist = 0;          // cumulative distance over which elevation is unchanged, used for gradient calc
    let hills = [];
    let gradM;
    let d0 = 0;
    let t0 = 0;
    let e0 = 0;

    // distances
    let kmSplits = [];            // array containing location of km markers and pace splits
    let mileSplits = [];          // array containing location of mile markers and pace splits

    /**
     * Pre-process
     *
     */
    const isTime = typeof this.points[0].time !== 'undefined' ? true : false;
    const isElev = typeof this.points[0].elev !== 'undefined' ? true : false;

    let index = 0;
    do  {

      // skipping the first point, compare this point to the previous one
      if (index !== 0) {

        const lastPoint = this.points[index-1];
        const thisPoint = this.points[index];

        /**
         * Distance
         * Incremental and cumulative distance
         */
        dDist = p2p(thisPoint, lastPoint);
        distance += dDist;
        cumDistance.push(distance/1000.0);
        eDist += dDist;
        p2pMax = dDist > maxDist ? dDist : maxDist;

        /**
         * Moving Time
         * Compare speed between previous point and this, against threshold.
         * Eliminate data points below threshold
         * Output: new array with indexes of saved points
         * NOT RUN FOR ROUTE AS LACKING ANY TIME INFORMATION
         */
        if ( isTime ) {

          // track moving time and distance
          if ((dDist / 1000) / (thisPoint.time / 3600) > SPEED_THRESHOLD ) {
            movingTime += thisPoint.time;
            movingDist += dDist;
          }
          // total time to this point
          duration += thisPoint.time;

        }

        /**
        * Mile and KM splits
        * Create new arrays containing point number at milestone, and pace for last segment
        * TODO: take this into distance function and only find splits here?  avoids duplication
        */
        if ( distance / (1000 * (kmSplits.length + 1)) >= 1 || index === this.pathSize) {
          // first point past finished km
          if ( isTime ) {
            var dt = (duration - lastKmStartTime) / 60;     //time in mins
            var dd = (distance - lastKmStartDist) / 1000;
          }
          kmSplits.push([index, isTime ? dt/dd : 0]);
          lastKmStartTime = duration;
          lastKmStartDist = distance;
        }
        if ( distance * KM_TO_MILE / (1000 * (mileSplits.length + 1)) >= 1 || index === this.pathSize) {
          if ( isTime ) {
            var dt = (duration - lastMileStartTime) / 60;
            var dd = (distance - lastMileStartDist) / 1000 * KM_TO_MILE;
          }
          mileSplits.push([index, isTime ? dt/dd : 0]);
          lastMileStartTime = duration;
          lastMileStartDist = distance;
        }

        /**
        * Elevation tracking and analyse gradient and hills
        * Count cumulative elevation gain/drop
        * Gradient and slope type
        */
        if ( isElev ) {
          // elevation data exists on this point

          lastElev = lastPoint.elev;
          thisElev = thisPoint.elev;
          delta = thisElev - lastElev;

          maxElev = thisElev > maxElev ? thisElev : maxElev;
          minElev = thisElev < minElev ? thisElev : minElev;

          // if the sign of the last change in elevation is the same as the sum, add it on, otherwise dont
          if (Math.sign(deltaSum) === Math.sign(delta)) {
            deltaSum += delta;

          // sign of the delta has changed so add to ascent/descent if over threshold and reset the sum
          } else {
            if (Math.abs(deltaSum) > ASCENT_THRESHOLD) {
              if (deltaSum > 0) {
                ascent += deltaSum;
              } else {
                descent += deltaSum;
              }
            }
            deltaSum = delta;
          } 

          // determine type of slope based on gradient
          const gradient = (thisElev - lastElev) / eDist * 100;
          if ( gradient < (-GRAD_THRESHOLD) ) { thisSlopeType = -1; }
          else if ( gradient > GRAD_THRESHOLD ) { thisSlopeType = 1; }
          else { thisSlopeType = 0; };

          // max gradient; gets reset if slopetype changes
          gradM = Math.abs(gradient) > gradM ? Math.abs(gradient) : gradM;

          // reset distance each time elevation changes
          eDist = 0;
        }

        if ( typeof lastSlopeType === 'undefined' ) {
          // slopeType has not been initialised: do so
          lastSlopeType = thisSlopeType;
          e0 = thisElev;
          gradM = 0;

        } else {
          // slopeType exists

          if ( thisSlopeType !== lastSlopeType  || index === this.pathSize) {
            // slopetype has changed

            const de = thisElev - e0;
            if ( Math.abs(de) > HILL_THRESHOLD ) {

              const dd = distance - d0;
              const dt = (duration - t0);

              hills.push({
                dHeight: de,
                dDist: dd,
                dTime: isTime ? dt : 0,
                pace: isTime ? (dt/60)/(dd/1000) : 0,
                ascRate: isTime ? de/(dt/60) : 0,
                gradient: {
                  max: lastSlopeType === 1 ? gradM : -gradM,
                  ave: de / dd * 100
                }
              });

            }
            d0 = distance;
            t0 = duration;
            e0 = thisElev;
            gradM = 0;
            lastSlopeType = thisSlopeType;
          }

        } // if (point.elev)

      } else {
        // index === 0
        if ( isElev) thisElev = this.points[index].elev;
      }

      /**
     * Keep track of previous points for next loop
     */
      // lastPoint = thisPoint;
      index++;

    } while (index <= this.pathSize)

    return{

      duration: isTime ? duration: 0,
      bbox: this.bbox,
      distance: distance,
      cumDistance: cumDistance,
      nPoints: this.pathSize,
      pace: isTime ? (duration/60) / (distance/1000) : 0,
      movingStats: {
        movingTime: isTime ? movingTime : 0,
        movingDist: isTime ? movingDist : 0,
        movingPace: isTime ? (movingDist/60) / (movingDist/1000) : 0,
      },
      elevations: {
        ascent: ascent,
        descent: descent,
        maxElev: maxElev,
        minElev: minElev,
        lumpiness: (ascent - descent) / distance,
      },
      hills: hills,
      splits: {
        kmSplits: kmSplits,
        mileSplits: mileSplits
      },
      p2p: {
        max: p2pMax,
        ave: distance / this.pathSize
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