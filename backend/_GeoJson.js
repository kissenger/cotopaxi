
const Path = require('./_Path').Path;

const UP_COLOUR = '#FF0000';
const DOWN_COLOUR = '#00FF00';
const FLAT_COLOUR = '#0000FF';
const ROUTE_COLOUR = '#0000FF';
const TRACK_COLOUR = '#00FF00';

class GeoJSON {

  constructor(docOrPath) {

    // expect a mongo document or Path instance
    // input is a Path object -
    // NOTE lngLats is an array of arrays
    if (docOrPath instanceof Path) {
      this.lngLats = docOrPath.points.map( c => [c.lng, c.lat]);
      this.elevs = docOrPath.elevs;
      this.properties = {
        pathId: '0000',
        params: {
          cumDistance: docOrPath.cumDistance,
          matchPairs: docOrPath.matchedPoints,
          elev: docOrPath.elevs
        },
        info: {
          name: docOrPath.name,
          description: docOrPath.description,
          isLong: docOrPath.isLong,
          isElevations: docOrPath.isElevations,
          category: docOrPath.category,
          pathType: docOrPath.pathType
        },
        stats: docOrPath.stats
      }
      this.bbox = docOrPath.bbox;

    // input is a Mongo Document
    } else {
      this.lngLats = docOrPath.geometry.coordinates;
      this.elevs = docOrPath.params.elev;
      this.properties = {
        pathId: docOrPath._id,
        params: docOrPath.params,
        info: docOrPath.info,
        stats: docOrPath.stats
      };
      this.bbox = docOrPath.stats.bbox;
    }

    this.features = [];
  }

  // returns a geoJson feature for the provided coordinates, elevations and colour
  feature(coords, elevs, colour) {
    return {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: coords
      },
      properties: {
        lineColour: colour,
        lineWidth: 5,
        lineOpacity: 0.5,
        params: {
          elev: elevs
        }
      }
    }
  }

  // returns a featureCollection containing all of the features on the class instance
  featureCollection() {
    return {
      type: 'FeatureCollection',
      bbox: [this.bbox.minLng, this.bbox.minLat, this.bbox.maxLng, this.bbox.maxLat],
      features: this.features,
      properties: this.properties
    }
  }


}


class GeoRoute extends GeoJSON{

  // expect a mongo document or a Path object as input
  constructor(docOrPath) {
    super(docOrPath);

    this.features.push(this.feature(this.lngLats, this.elevs, ROUTE_COLOUR))
    return this.featureCollection();

  }


}


/**
 * Creates a GeoJSON object in which ascents, descent and flats are coloured
 * In addition, features have the slice of the relevant elevation so google charts can plot the same
 */
class GeoHills extends GeoJSON {

  constructor(docOrPath) {
    super(docOrPath);

    // use the hills array provided in stats to determine an array of pairs of numbers, defining how to slice the lngLats and elevs arrays
    // if there are no hills in the array, simply return a route geoJSON
    console.log(this.properties.stats.hills);
    if (this.properties.stats.hills.length > 0) {
      console.log('hlils');
      const slicePairs = this.getSlicePairs();
      slicePairs.forEach( pair => {
        // this.properties.params.elevHills.push({
        //   elevs: this.properties.params.elev.slice(pair[1],pair[2]+1),
        //   colour: pair[0]
        // })
        let coords = this.lngLats.slice(pair[1], pair[2]+1);
        let elevs = this.elevs.slice(pair[1], pair[2]+1);
        this.features.push(this.feature(coords, elevs, pair[0]));
      })
    } else {
      console.log('no hlils');
      this.features.push(this.feature(this.lngLats, this.elevs, ROUTE_COLOUR));
    }

    return this.featureCollection();

  }

  getSlicePairs() {

    const hills = this.properties.stats.hills;

    // get an array of numbers [startSlice, endSlice, colour] describedin how to slice up lngLats
    // probably a more succint way of doing this but itll do for now
    const slicePairs = [];
    if (hills[0].startPoint !== 0 ) { slicePairs.push([FLAT_COLOUR, 0,hills[0].startPoint])};
    for (let i = 0, iMax = hills.length -1; i <= iMax; i++) {
      // push the current hill
      slicePairs.push([hills[i].aveGrad > 0 ? UP_COLOUR : DOWN_COLOUR, hills[i].startPoint, hills[i].endPoint]);
      // push the next flat
      if (i !== iMax) {
        if (hills[i].endPoint !== hills[i+1].startPoint) {
          slicePairs.push([FLAT_COLOUR, hills[i].endPoint, hills[i+1].startPoint]);
        }
      } else {
        if (hills[i].endPoint !== this.lngLats.length-1) {
          slicePairs.push([FLAT_COLOUR, hills[i].endPoint, this.lngLats.length-1]);
        }
      }
    }

    return slicePairs;

  }
}

class GeoFringe extends GeoJSON {

}

module.exports = {GeoRoute, GeoFringe, GeoHills}
