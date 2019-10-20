/**
 *
 * This file contains functions for reading files and catching data into relevant arrays
 *
 */


// Imports
var fs = require('fs');
var gpsfun = require('./gpsfun.js');


 /**
 * getPathFromGpx
 * Simply reads the content of a gpx file into an object named "data", which is
 * passed back to the calling routine.
 *
 * Notes on useage:
 *  --> return new Promise(function (resolve, reject) { // asynchronous code //});
 *          resolve is the object passed back if the promise is fulfilled
 *          reject is the object passed back if there is an error
 *
 *  --> fs.readfile(fn, "utf8", function (err, data) { // code // });
 *          err is data passed back in case of error
 *          data is passed back in case that file is read succesfully.
 */

function readUploadedFile(fn) {

  return new Promise(function (resolve, reject){
    fs.readFile(fn, "utf8", function(err, data){
      if (err) reject(err);
      else resolve(data);
    });
  });

};

/**
 * getPathFromGpx
 *
 * Purpose is to convert data object from file read, into a Path object containing Point objects
 * for each data point.
 *
 */
function gpxToPath(data) {

  // if ( data.indexOf('\n' !== -1 ) {
  //   newlineChar = '\n'
  // } elseif

  var a = 0;                          // start of interesting feature
  var b = data.indexOf("\r",a);     // end of interesting feature
  var i = 0;                          // counter
  var pathType = '';
  var nameOfPath = '';                 // "route" or "path"
  const maxIters = 100000;             // will only process this number of points
  var latValue, lngValue, eleValue, timeValue;


  /**
   * Loop until we find track or route start
   */
  do {

    lineData = data.slice(a,b)
    a = b + 2;
    b = data.indexOf("\r",a);

    if ( lineData.indexOf("<trk>") !== -1 ) {
      // console.log('getPathFromGpx says: found a track');
      pathType = "track";
      typeTag = "trkpt";
      break;
    }

    if ( lineData.indexOf("<rte>") !== -1 ) {
      // console.log('getPathFromGpx says: found a route');
      pathType = "route";
      typeTag = "rtept";
      break;
    }

  } while ( i < maxIters )

  /**
   *  Try to find a name
   */
  lineData = data.slice(a,b)
  a = lineData.indexOf("<name>");
  b = lineData.indexOf("</name>");
  if ( a !== -1 && b !== -1 ) {
    nameOfPath = lineData.slice(a + 6, b);
  }

  path = new gpsfun.Path(nameOfPath, pathType, []);

  /**
   *  If this is a track file....
   */

    ptEnd = b;

    do {

      // get the start and end of the current track point, break from loop if not found
      ptStart = data.indexOf(typeTag,ptEnd);
      ptEnd = data.indexOf('/' + typeTag,ptStart);
      if ( ptStart == -1 || ptEnd == -1 ) {
        break;
      }
      ptData = data.slice(ptStart,ptEnd)
      i++;

      // lat and long
      a = ptData.indexOf("lat=");
      b = ptData.indexOf("lon=");
      if ( a !== -1 && b !== -1 ) {
        if ( b > a ) {
          latValue = parseFloat(ptData.slice(a, b).match(/[-0123456789.]/g).join(""));
          lngValue = parseFloat(ptData.slice(b).match(/[-0123456789.]/g).join(""));
        } else {
          lngValue = parseFloat(ptData.slice(b, a).match(/[-0123456789.]/g).join(""));
          latValue = parseFloat(ptData.slice(a).match(/[-0123456789.]/g).join(""));
        }
      }

      // elevation
      a = ptData.indexOf("<ele>");
      b = ptData.indexOf("</ele>");
      if (a != -1 && b != -1) {
        eleValue = parseFloat(ptData.slice(a,b).match(/[-0123456789.]/g).join(""));
      }

      // time
      a = ptData.indexOf("<time>");
      b = ptData.indexOf("</time>");
      if (a != -1 && b != -1) {
        timeValue = ptData.slice(a,b).match(/[-0123456789.TZ:]/g).join("");
      }

      // create point and push to path
      path.points.push(new gpsfun.Point(i, [latValue, lngValue], eleValue, timeValue, null, null));

    } while ( i < maxIters )

    // If route then simplify
    if ( pathType === 'route' ) {
      path = gpsfun.simplifyPath(path);
    }

    // Now we have a full path, determine path type and update name
    if ( nameOfPath === '' ) {
      path.name = path.category() + ' ' + path.type;
    }

    // console.log(path);
  return path;

}


/**
 *
 * Create geoJSON object of a single path, provided as a list of coordinates
 * standard: https://tools.ietf.org/html/rfc7946
 *
 * { type: 'FeatureCollection',
 * bbox: [ -2.600903969, 51.330437004, -2.255170998, 51.517311033 ],
 * features:
 *  [ { type: 'Feature',
 *      name: 1540235928085,
 *      bbox: [ -2.259599996, 51.345564998, -2.242749018, 51.351090014 ],
 *      geometry: { type: 'LineString', coordinates: [Array] },
 *      properties:
 *			  { timeArray: [Array],
 *					pathStats: [Object],
 *					color: 'red',
 *					name: 1540235827227 } },
 *     { type: 'Feature',
 *       name: 1540235928110,
 *       bbox: [ -2.600889971, 51.501488011, -2.57467297, 51.517338022 ],
 *       geometry: { type: 'LineString', coordinates: [Array] },
 *       properties:
 *				{ timeArray: [Array],
 *				 pathStats: [Object],
 *				 color: 'orange',
 *				 name: 1540235827252 } } ] }
 */
function getSingleGeoJson(path) {

  const pathStats = path.stats();

  return {
    "name": path.name,
    "bbox": pathStats.boundingBox,
    "type": "Feature",
    "geometry": {
      "type": "LineString",
      "coordinates": path.points.map(x => [x.latLng[1], x.latLng[0]]) // store as lng, lat
    },
    "properties": {
      // "timeArray": path.points.map(x => x.timeStamp),
      "startTime": path.points[0].timeStamp,
      "pathStats": {
        "totalDistance": pathStats.totalDistance,
        "totalAscent": pathStats.totalAscent,
        "totalDescent": pathStats.totalDescent,
        "longestClimb": pathStats.longestClimb,
        "longestDescent": pathStats.longestDescent,
        "longestClimbGradient": pathStats.longestClimbGradient,
        "longestDescentGradient": pathStats.longestDescentGradient,
        "maxGradient": pathStats.maxGrmaxGradientad,
        "minGradient": pathStats.minGradient,
        "maxDistBtwnTwoPoints": pathStats.maxDistBtwnTwoPoints,
        "aveDistBtwnTwoPoints": pathStats.aveDistBtwnTwoPoints
    }
  }
  };

};

/**
 *
 * Compile an array of single paths in geoJSON format, into a single geoJSON object
 *
 */
function getMultiGeoJson(arrayOfGeoJsons) {

  let minLat = 180, maxLat = -180, minLng = 180, maxLng = -180;

  arrayOfGeoJsons.forEach( (geoJson, i) => {
    minLat = geoJson.bbox[1] < minLat ? geoJson.bbox[1] : minLat;
    minLng = geoJson.bbox[0] < minLng ? geoJson.bbox[0] : minLng;
    maxLat = geoJson.bbox[3] > maxLat ? geoJson.bbox[3] : maxLat;
    maxLng = geoJson.bbox[2] > maxLng ? geoJson.bbox[2] : maxLng;
    geoJson.properties.color = getRandomColour(i);
    geoJson.properties.name = geoJson.name;
  })

  return {
    "type": "FeatureCollection",
    "bbox": [minLng, minLat, maxLng, maxLat],
    "features": arrayOfGeoJsons.map(x => x)
  }

};

function getRandomColour(i) {

  const colorsArr = ['red', 'orange', 'blue', 'purple', 'green',  'brown', 'grey-blue'];

  if ( i > colorsArr.length ) {
    const letters = '456789ABCDEF';
    var color = '#';
    for (var j = 0; j < 6; j++) {
      color += letters[Math.floor(Math.random() * letters.length)];
    }
  } else {
    color = colorsArr[i];
  }

  return color;
}

/**
 *
 *
 */

module.exports = {
  readUploadedFile,
  gpxToPath,
  getSingleGeoJson,
  getMultiGeoJson
};
