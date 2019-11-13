const Point = require('_Point').Point;

/**
 * function p2p
 * returns distance in meters between two GPS points
 *
 * Implements the Haversine formula
 * https://en.wikipedia.org/wiki/Haversine_formula
 * Vincenty's formula is more accurate but more expensive
 * https://en.wikipedia.org/wiki/Vincenty's_formulae
 *
 * lngLat1 is lng/lat of point 1 in decimal degrees
 * lngLat2 is lng/lat of point 1 in decimal degrees
 *
 * https://www.movable-type.co.uk/scripts/latlong.html
 * can be sped up: https://stackoverflow.com/questions/27928
 *
 */
function p2p(p1, p2) {

  if ( !(p1 instanceof Point) || !(p2 instanceof Point) ) {
    console.log("Error from p2p: arguments should be of Point class");
    return 0;
  }

  const R = 6378.137;     // radius of earth

  const lat1 = degs2rads(p1.lat);
  const lat2 = degs2rads(p2.lat);
  const lng1 = degs2rads(p1.lng);
  const lng2 = degs2rads(p2.lng);

  const dlat = lat1 - lat2;
  const dlng = lng1 - lng2;

  const a = (Math.sin(dlat/2.0) ** 2.0 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlng/2.0) ** 2.0) ** 0.5;
  const c = 2.0 * Math.asin(a);

  return d = R * c * 1000.0;  // distance in metres

}

function degs2rads(degs) {
  return degs * Math.PI / 180.0;
};


/**
* returns distance in meters between a line and a point
*
* @param {Point} p1 lng/lat of line start in decimal degrees as instance of Point class
* @param {Point} p2 lng/lat of line end in decimal degrees as instance of Point class
* @param {Point} p3 lng/lat of mid-point in decimal degrees as instance of Point class
*
* https://www.movable-type.co.uk/scripts/latlong.html
*/

function p2l(p1, p2, p3) {

  if ( !(p1 instanceof Point) || !(p2 instanceof Point) || !(p3 instanceof Point)) {
    console.log("Error from p2l: arguments should be of Points class");
    return 0;
  }

  const d13 = p2p(p1, p3) / 1000.0;
  const brg12 = bearing(p1, p2);
  const brg13 = bearing(p1, p3);

  return Math.asin( Math.sin( d13/6378.137 ) * Math.sin( brg13-brg12 ) ) * 6378.137 * 1000.0;

}

/**
 * ---------------------------------------------------
 * returns bearing in radians between two GPS points
 * ---------------------------------------------------
 * latLng1 is lat/lng of point 1 in decimal degrees
 * latLng2 is lat/lng of point 2 in decimal degrees
 *---------------------------------------------------
 * https://www.movable-type.co.uk/scripts/latlong.html
 *---------------------------------------------------
 */
function bearing(p1, p2) {

  if ( !(p1 instanceof Point) || !(p2 instanceof Point) ) {
    console.log("Error from bearing: arguments should be of Points class");
    return 0;
  }

  const lat1 = degs2rads(p1.lat);
  const lat2 = degs2rads(p2.lat);
  const lng1 = degs2rads(p1.lng);
  const lng2 = degs2rads(p2.lng);

	x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2)* Math.cos(lng2 - lng1)
	y = Math.sin(lng2 - lng1) * Math.cos(lat2)

	return Math.atan2(y, x)

}


/**
 * Returns bounding box in the form [minLng, minLat, maxLng, maxLat]
 * @param {*} lngLatArray
 */
function boundingBox(lngLatArray) {
  const bbox = [ 180, 90, -180, -90 ];
  for (let i = 0, n = lngLatArray.length; i < n; i++) {
    bbox[0] = lngLatArray[i][0] < bbox[0] ? lngLatArray[i][0] : bbox[0];
    bbox[1] = lngLatArray[i][1] < bbox[1] ? lngLatArray[i][1] : bbox[1];
    bbox[2] = lngLatArray[i][0] > bbox[2] ? lngLatArray[i][0] : bbox[2];
    bbox[3] = lngLatArray[i][1] > bbox[3] ? lngLatArray[i][1] : bbox[3];
  };
  return bbox;
}


/**
 * Returns an outer bounding box for a given array of inner bounding boxes
 * @param {Array<number>} arrayOfBboxes
 */
function outerBoundingBox(arrayOfBboxes) {
  let outerBbox = [ 180, 90, -180, -90 ];
  arrayOfBboxes.forEach( (x) => {
    outerBbox[0] = x[0] < outerBbox[0] ? x[0] : outerBbox[0];
    outerBbox[1] = x[1] < outerBbox[1] ? x[1] : outerBbox[1];
    outerBbox[2] = x[2] > outerBbox[2] ? x[2] : outerBbox[2];
    outerBbox[3] = x[3] > outerBbox[3] ? x[3] : outerBbox[3];
  });
  return outerBbox;
}


/**
 * Calculates distance in metres covered by path
 * @param {Array<number>} lngLats array containing [lng, lat] coordinates
 */
function pathDistance(lngLats) {

  let distance = 0;
  let lastPoint, thisPoint;

  for (let i = 0, n = lngLats.length; i < n; i++) {
    thisPoint = new Point([lngLats[i]]);
    if (i > 0) distance += p2p(thisPoint, lastPoint);
    lastPoint = thisPoint;
  }

  return distance;
}


/**
 * Determines if point lies within bounding box
 * @param {Array<number>} bbox bounding box as [minLng, minLat, maxLng, maxLat]
 * @param {Array<number>} point point as lngLat coordinate pair
 * @returns {boolean} true if point is in box, false otherwise
 */
function isPointInBBox(point, bbox) {

  return  point.lng < bbox[2] &&  /* lng is less than maxLng */
          point.lng > bbox[0] &&  /* lng is greater than minLng */
          point.lat < bbox[3] &&  /* lat is less than maxLat */
          point.lat > bbox[1];    /* lat is greater than minLat */
}

/**
 * function simplifyPath
 * simplify path using perpendicular distance method
 * http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.95.5882&rep=rep1&type=pdf 
 * @param {*} points array of Point instances defining the path to be simplified
 */
function simplify(points) {
    
  if (DEBUG) { console.log(timeStamp() + ' >> Simplify Path '); }

  const TOLERANCE = 10;     // tolerance value in metres; the higher the value to greater the simplification
  const origLength = points.length;
  let i;
  let flag;

  // create array of indexes - what remains at end are points remaining after simplification
  let j = Array.from(coords, (x, i) => i)

  // Repeat loop until no nodes are deleted
  while ( flag === true ) {
    i = 0;
    flag = false;   // if remains false then simplification is complete; loop will break
    while ( i < ( j.length - 2 ) ) {
      const pd = p2l( points[j[i]], points[j[i+2]], points[j[i+1]] );
      if ( Math.abs(pd) < TOLERANCE ) {
        j.splice(i+1, 1); // delete a point
        flag = true;
      }
      i++;
    }
  }

  // show console how succesful weve been
  if (DEBUG) { console.log(timeStamp() + ' >> Simplified ' + origLength + '-->' + j.length + ' points(' +
              ((j.length/origLength)*100.0).toFixed(1) + '%)'); }

  return j.map( x => points[x] );

}


// /**
//  * Objectifies a point to ensure correct format for library methods
//  * @param {Array<number>} array
//  */
// class Point {

//   constructor(array) {
//     this.lng = array[0][0];
//     this.lat = array[0][1];
//     if ( typeof array[1] !== 'undefined' ) this.elev = array[1];
//     if ( typeof array[2] !== 'undefined' ) this.time = array[2];
//     if ( typeof array[3] !== 'undefined' ) this.hr = array[3];
//     if ( typeof array[4] !== 'undefined' ) this.cad = array[4];
//   }

// }

module.exports = {
  p2p,
  p2l,
  bearing,
  outerBoundingBox,
  pathDistance,
  boundingBox,
  isPointInBBox,
  simplify
};
