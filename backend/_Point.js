
const debugMsg = require('./utils').debugMsg;
const simplify = require('./geoLib.js').simplify;
const boundingBox = require('./geoLib').boundingBox;
const p2p = require('./geoLib').p2p;
const bearing = require('./geoLib').bearing;

const SIMPLIFY_TOLERANCE = require('./globals').SIMPLIFY_TOLERANCE;
const LONG_PATH_THRESHOLD = require('./globals').LONG_PATH_THRESHOLD;
const MATCH_DISTANCE = require('./globals').MATCH_DISTANCE;
const MATCH_BUFFER = require('./globals').MATCH_BUFFER;
const MOVING_AVERAGE_PERIOD = require('./globals').MOVING_AVERAGE_PERIOD;
const ASCENT_THRESH = require('./globals').ASCENT_THRESH;
const HILL_THRESH = require('./globals').HILL_THRESH;

/**
 * Point class is used to associate point data together, so the coordinates, elevation etc
 * for a single point are associated and can be accessed through point.lat, point.lng for example.
 */
class Point {

  constructor(array) {
    this.lng = array[0][0];
    this.lat = array[0][1];
    if ( typeof array[1] !== 'undefined' ) this.elev = array[1];
  }

  addElevation(e) {
    this.elev = e;
  }

  remElevation() {
    this.elev = null;
  }

  getElevation() {
    return this.elev ? this.elev : null;
  }
}

/**
 * PointsList class handles the raw imported data, coords, elevations and in future other params such as HR etc
 * It is instantiated with what is supplied --> elevs for example must be found in advance
 * The exception is that when a list of points is deemed 'long', some points are discardded through simplification
 * and the any provided elevations are deleted
 * All the stats relevant to the path are calculated.
 * Immediately converts all data into an array of Points instances so that all point related data is associated together
 */
class PointsList {

  constructor(coords, elevs = []) {

    debugMsg('PointsList');

    // create an array of point instances
    // by doing this we associate elevs with coords at the start and make eg simplification easier
    this.points = coords.map( (coord, i) => new Point( [coord, elevs[i]] ));
    this.isSimplified = false;

    // test for length, if too long then simplify and update the class points
    // also delete any elevations that came with the instantiation
    // do this before doing any calculations on the points, although tempting to combine


    // do a prelim simplification loop - this has a number of purposes
    // 1) It guards against duplicate points, which throw off grad calc
    // 2) It goes some way to harminising distance between points for paths from different sources
    const simple = simplify(this.points, 2);
    this.points = simple.points;
    this.simplificationRatio = simple.ratio;
    this.isLong = this.points.length > LONG_PATH_THRESHOLD;

    if (this.isLong) {
      debugMsg('Path.init(): path is long');
      this.discardElevs();
    }

    // if (this.isLong) {

    //   debugMsg('Path.init(): Long Path, trying to simplify');

    //   // if nPoints is above threshold, then simplify the path
    //   this.points = simplify(this.points, SIMPLIFY_TOLERANCE);
    //   this.isSimplified = true;

    //   // if still too long, then flag as such and remove elevations
    //   this.isLong = this.points.length > LONG_PATH_THRESHOLD;
    //   if (this.isLong) {
    //     debugMsg('Path.init(): Still long');
    //     this.discardElevs();
    //   }

    // }

    // if (booSimplify && !this.isSimplified) {
    //   this.points = simplify(this.points, SIMPLIFY_TOLERANCE);
    //   this.isSimplified = true;
    // }

    // now calculate other class properties
    this.nPoints = this.points.length;
    this.distanceData = this.calcDistanceData();
    if (this.elevs().length > 0) { this.elevationData = this.calcElevationData(this.distanceData); }
    this.matchedPoints = this.getMatchedPoints();

  }

  getInfo() {
    const category = this.getCategory();
    return {
      isLong: this.isLong,
      isElevations: this.elevs().length > 0,
      category,
      direction: this.getDirection(category)
    }
  }

  getStats() {

    //take a copy of dist stats and delete what we dont need (ie params)
    let stats = {...this.distanceData};
    delete stats.cumDistance;

    // add in other stuff we do need
    stats = {
      bbox: boundingBox(this.points),
      nPoints: this.nPoints,
      simplificationRatio: this.simplificationRatio,
      ...stats
    }

    // add elevations if appropriate
    if (!this.isLong) {
      const eStats = {...this.elevationData}
      delete eStats.smoothedElev;
      stats = {...stats, ...eStats}
    }

    return stats
  }

  // returns a params object for svaing to Mongo
  getParams() {
    let params = {
      matchedPoints: this.matchedPoints,
      cumDistance: this.distanceData.cumDistance,
    };

    if (!this.isLong) {
      params = {
        ...params,
        smoothedElev: this.elevationData.smoothedElev,
        elev: this.elevs()
      }
    }

    return params;
  }

  // return an array of the elevations that exist on the points
  elevs() {
    const e = this.points.map( p => p.getElevation() );
    if ( e.every( e => e === null) ) {
      return [];
    } else {
      return e;
    }
  }

  // returns an array of lnglats from poitn instances, called in order to save data to Mongo
  lngLats() {
    return this.points.map( p => [p.lng, p.lat]);
  }

  // delete all elevations on the point instances - called when long path is detected
  discardElevs() {
    this.points.forEach( p => p.remElevation() );
  }

  addElevations(elevs) {
    this.points.forEach( (point, i) => point.addElevation(elevs[i]) );
    if (!this.isLong) { this.elevationData = this.calcElevationData(this.distanceData); }
  }

  /**
   * Return only the stats relevant to distance - seperate routine as elevations are not calculated
   * for 'long' paths
   * Note this contains both 'params' and 'stats' and will be split out later
   */
  calcDistanceData() {

    debugMsg('PointsList.calcDistanceData()');

    const dDistance = this.points.map( (p, i, pts) => i === 0 ? 0 : p2p(p, pts[i-1]) );
    const cumDistance = dDistance.map( (p, i) => dDistance.slice(0, i + 1).reduce( (sum, d) => sum + d, 0) );

    return{
      distance: cumDistance[this.nPoints - 1],
      cumDistance,
      dDistance,
      nPoints: this.nPoints,
      p2p: {
        max: Math.max(...dDistance),
        ave: dDistance.reduce( (a, b) => a+b, 0) / this.nPoints
      }
    }

  }

 /**
  * Return only the stats relevant to elevations - seperate routine as elevations are not calculated
  * for 'long' paths
  * Note this contains both 'params' and 'stats' and will be split out later
  *
  * Improvements to be made:
  * filter hills array in postprocessing to remove aveGrad < thresh
  * Also detect adjacent hill with few points or small drop between and combine (or better algorithm in the first place)
  */
  calcElevationData(dist) {

    debugMsg('PointsList.calcElevationData()');

    // elevations - note all elevations are calculated off the smoothed average - dont smooth for a short path
    // TODO need to error catch points with very small time increment or coincident points, when dist = 0, grad = inf and error
    const elevs = this.elevs().length < MOVING_AVERAGE_PERIOD * 2 ? this.elevs() : movingAverage(this.elevs(), MOVING_AVERAGE_PERIOD)
    const grads = elevs.map( (e, i, eArr) => i === 0 ? 0 : (e - eArr[i-1]) / dist.dDistance[i] * 100 );

    // initilise loop variables
    let de = 0;                 // cumulative change in elevation
    let p0 = 0;                 // point number at which hill begins
    const hillsArr = [];        // array to containg start and end points of hill as
    let hillSum = 0;            // cumulative change in height used to calculate hills
    let dSum = 0                // cumulative change in height used to calculate ascent/descent
    let ascent = 0;
    let descent = 0;

    // loop through points to calculate ascent and descent, and to detect hills
    for (let i = 1; i < this.nPoints; i++ ) {

      de = elevs[i] - elevs[i-1];

      // Calculates the ascent and descent statistics
      if (Math.sign(dSum) === Math.sign(de)) {
        // same direction, increment
        dSum += de;

      } else {
        // change of direction, check threshold and increment if needed
        if (Math.abs(dSum) > ASCENT_THRESH) {
          if (dSum > 0) { ascent += dSum; }
          else { descent += dSum; }
        }
        dSum = de;
      }

      // Calculates the start and end points of hills and stashes them in hills array
      // This block is similar to above but because we need to use a different threshold, we need a new loop
      if (Math.sign(hillSum) === Math.sign(de)) {
        // same direction, increment
        hillSum += de;
      } else {
        // direction change, check threshold and store hill if needed
        if (Math.abs(hillSum) > HILL_THRESH) {
          hillsArr.push([p0 - 1, i - 1]);
        }
        hillSum = de;
        p0 = i;
      }

    } // close for loop

    // check we didnt end on a hill
    if (Math.abs(dSum) > ASCENT_THRESH) {
      if (dSum > 0) { ascent += dSum; }
      else { descent += dSum; }
    }
    if (Math.abs(hillSum) > HILL_THRESH) {
      hillsArr.push([p0 - 1, this.nPoints - 1]);
    }

    // get stats for each hill in the list
    const hills = hillsArr.map( hill => ({
        dHeight: elevs[hill[1]] - elevs[hill[0]],
        dDist: dist.cumDistance[hill[1]] - dist.cumDistance[hill[0]],
        maxGrad: Math.max( ...grads.slice(hill[0], [hill[1]+1]).map( g => Math.abs(g) ) ),
        aveGrad: (elevs[hill[1]] - elevs[hill[0]]) / (dist.cumDistance[hill[1]] - dist.cumDistance[hill[0]]) * 100,
        startPoint: hill[0],
        endPoint: hill[1]
      })
    );

    return {
      smoothedElev: elevs,
      elevations: {
        ascent,
        descent,
        maxElev: Math.max(...elevs),
        minElev: Math.min(...elevs),
        lumpiness: (ascent - descent) / dist.distance
      },
      hills
    }

  } // getStats()


  /**
   * Returns an array of matched point pairs, useful for route categorisation but also sent to front end for debugging
   */
  getMatchedPoints() {
    debugMsg('PointsList.getMatchedPoints()');

    const mp = [];
    for ( let i = 0; i < this.nPoints; i++ ) {  // look at each point
      for ( let j = i + MATCH_BUFFER; j < this.nPoints; j++ ) {  // look at each point ahead of it

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
    debugMsg('PointsList.getCategory()');

    const START_AT_END_THRESH = 250;  // distance in metres, if start and end points are this close then consider as matching
    const PC_THRESH_UPP = 90;        // if % shared points > PC_THRESH_UPP then consider as 'out and back' route
    const PC_THRESH_LOW = 10;        // if % shared points < PC_THRESH_LOW the consider as 'one way' or 'circular' depending on whether start is returned toKs

    const pcShared = this.matchedPoints.length / this.nPoints * 100 * 2;  //(x2 becasue only a max 1/2 of points can be matched)
    const isStartAtEnd = p2p(this.points[0], this.points[this.nPoints - 1]) < (START_AT_END_THRESH);

    if ( pcShared > PC_THRESH_UPP ) { return 'Out and back'; }
    if ( isStartAtEnd && pcShared < PC_THRESH_LOW ) { return 'Circular'; }
    if ( !isStartAtEnd && pcShared > PC_THRESH_UPP ) { return 'Out and back'; }
    if ( !isStartAtEnd && pcShared < PC_THRESH_LOW ) { return 'One way'; }

    // if nothing else fits then call it a hybrid
    return 'None';

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
  getDirection(cat) {
    debugMsg('PointsList.getDirection()');

    if ( cat === 'Circular' ) {

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


    } else if ( cat === 'One way' ) {

      const thisBrg = bearing(this.points[0], this.points[this.points.length - 1]);

      if (thisBrg > 5.890 || thisBrg <= 0.393) { return 'South to North'; }
      if (thisBrg > 0.393 && thisBrg <= 1.178) { return 'SW to NE'; }
      if (thisBrg > 1.178 && thisBrg <= 1.963) { return 'West to East'; }
      if (thisBrg > 1.963 && thisBrg <= 2.749) { return 'NW to SE'; }
      if (thisBrg > 2.749 && thisBrg <= 3.534) { return 'North to South'; }
      if (thisBrg > 3.534 && thisBrg <= 4.320) { return 'NE to SW'; }
      if (thisBrg > 4.320 && thisBrg <= 5.105) { return 'East to West'; }
      if (thisBrg > 5.105 && thisBrg <= 5.890) { return 'SE to NW'; }

    } else {

      return 'N/A';

    }
  }

} // class Points


/**
 * Moving average function, used to smooth elevations
 * Note that number of points to average over is smaller at the start and end of the
 * array, due to the way I have chosen to implemen ti
 * @param {*} array array to be smoothed
 * @param {*} period number of points over which to perform the moving average
 * @returns new array of same size as input array, with smoothed data
 */
function movingAverage(array, period) {

  //TODO proper error handling
  if (period % 2 === 0) return 'period should be odd';

  const SHIFT = (period - 1) / 2;
  const movingAverage = array.map( (p, i, arr) => {
    const low = Math.max(i - SHIFT, 0);
    const upp = Math.min(i + SHIFT + 1, array.length);
    return arr.slice(low, upp).reduce((a,b) => a + b, 0) / (upp - low);
  })

  return movingAverage;

}


module.exports = {
  PointsList
}

