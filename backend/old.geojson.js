const utils = require('./utils.js');


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
// function getSingle(path) {

//   const pathStats = path.stats();
//   // console.log(path.getTimeArray());

//   return {
//     "name": path.name,
//     "bbox": pathStats.boundingBox,
//     "type": "Feature",
//     "geometry": {
//       "type": "LineString",
//       "coordinates": path.points.map(x => [x.latLng[1], x.latLng[0]]) // store as lng, lat
//     },
//     "properties": {
//       "timeArray": path.points[0].timeStamp === '' ? '' : path.getTimeArray(),
//       "startTime": path.points[0].timeStamp,
//       "pathStats": {
//         "totalDistance": pathStats.totalDistance,
//         "totalAscent": pathStats.totalAscent,
//         "totalDescent": pathStats.totalDescent,
//         "longestClimb": pathStats.longestClimb,
//         "longestDescent": pathStats.longestDescent,
//         "longestClimbGradient": pathStats.longestClimbGradient,
//         "longestDescentGradient": pathStats.longestDescentGradient,
//         "maxGradient": pathStats.maxGrmaxGradientad,
//         "minGradient": pathStats.minGradient,
//         "maxDistBtwnTwoPoints": pathStats.maxDistBtwnTwoPoints,
//         "aveDistBtwnTwoPoints": pathStats.aveDistBtwnTwoPoints,
//         "duration": pathStats.duration
//     }
//   }
//   };

// };

// function getSingle(path) {

//   return {
//     "name": path.name,
//     "bbox": pathStats.boundingBox,
//     "type": "Feature",
//     "geometry": {
//       "type": "LineString",
//       "coordinates": path.points.map(x => [x.latLng[1], x.latLng[0]]) // store as lng, lat
//     },
//     "properties": {
//       "timeArray": path.points[0].timeStamp === '' ? '' : path.getTimeArray(),
//       "startTime": path.points[0].timeStamp,
//       "pathStats": {
//         "totalDistance": pathStats.totalDistance,
//         "totalAscent": pathStats.totalAscent,
//         "totalDescent": pathStats.totalDescent,
//         "longestClimb": pathStats.longestClimb,
//         "longestDescent": pathStats.longestDescent,
//         "longestClimbGradient": pathStats.longestClimbGradient,
//         "longestDescentGradient": pathStats.longestDescentGradient,
//         "maxGradient": pathStats.maxGrmaxGradientad,
//         "minGradient": pathStats.minGradient,
//         "maxDistBtwnTwoPoints": pathStats.maxDistBtwnTwoPoints,
//         "aveDistBtwnTwoPoints": pathStats.aveDistBtwnTwoPoints,
//         "duration": pathStats.duration
//     }
//   }
//   };

// };

/**
 *
 * Compile an array of single paths in geoJSON format, into a single geoJSON object
 *
 */
function getMulti(arrayOfGeoJsons) {

  let minLat = 180, maxLat = -180, minLng = 180, maxLng = -180;

  arrayOfGeoJsons.forEach( (geoJson, i) => {
    minLat = geoJson.bbox[1] < minLat ? geoJson.bbox[1] : minLat;
    minLng = geoJson.bbox[0] < minLng ? geoJson.bbox[0] : minLng;
    maxLat = geoJson.bbox[3] > maxLat ? geoJson.bbox[3] : maxLat;
    maxLng = geoJson.bbox[2] > maxLng ? geoJson.bbox[2] : maxLng;
    geoJson.properties.color = utils.getRandomColour(i);
    geoJson.properties.name = geoJson.name;
  })

  return {
    "type": "FeatureCollection",
    "bbox": [minLng, minLat, maxLng, maxLat],
    "features": arrayOfGeoJsons.map(x => x)
  }

};

module.exports = {getMulti};

