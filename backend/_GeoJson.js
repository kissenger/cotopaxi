const debugMsg = require('./utils').debugMsg;

const UP_COLOUR = '#FF0000';
const DOWN_COLOUR = '#00FF00';
const FLAT_COLOUR = '#0000FF';
const ROUTE_COLOUR = '#0000FF';

 /**
  * Class GeoJSON to handle creation of geoJson object to return to the front end.
  * The class can be populated using path instance or mongo document.  The mehtods
  * on the class are chained as follows:
  *   const newGeoJson = new GeoJson();
  *   return newGeoJson.fromPath(path).toGeoHills();
  */
class GeoJSON {

  constructor() {
    debugMsg('create GeoJson');
  }

  // populates the class instance with data from supplied Path instance
  // TODO handle error is provided object is not a Path
  fromPath(path) {
    this.lngLats = path.lngLat;
    this.properties = {
      pathId: '0000',    // assumes that path is 'created'
      params: path.pointsList.getParams(),
      stats: path.pointsList.getStats(),
      info: {
        ...path.pointsList.getInfo(),
        pathType: this.pathType
      }
    }
    this.elevs = this.properties.params.elev;
    this.bbox = this.properties.stats.bbox;
    this.features = [];
    return this;
  }

  // populates the class instance with data from supplied mongo document
  // TODO handle error if provided object is not a mongo document
  fromDocument(doc) {
    this.lngLats = doc.geometry.coordinates;
    this.elevs = doc.params.elev;
    this.properties = {
      pathId: doc._id,
      params: doc.params,
      info: doc.info,
      stats: doc.stats
    };
    this.bbox = doc.stats.bbox;
    this.features = [];
    return this;
  }

  toGeoRoute() {
    this.features = [this.feature(this.lngLats, this.elevs, ROUTE_COLOUR)];
    return this.featureCollection();
  }

  toGeoHills() {
    // use the hills array provided in stats to determine an array of pairs of numbers,
    // defining how to slice the lngLats and elevs arrays
    // if there are no hills in the array, simply return a route geoJSON
    if (this.properties.stats.hills.length > 0) {
      const segments = this.getHillSegments();
      segments.forEach( segment => {
        let coords = this.lngLats.slice(segment.start, segment.end + 1);
        let elevs = this.elevs.slice(segment.start, segment.end + 1);
        this.features.push(this.feature(coords, elevs, segment.colour));
      });
    } else {
      this.features.push(this.feature(this.lngLats, this.elevs, ROUTE_COLOUR));
    }
    return this.featureCollection();
  }

  /**
   * get an array of arrays of the form [[startSlice, endSlice, colour], ...] describing each
   * segment of the provided path according to whether it is uphill, downhill or flat
   * TODO could be improved, a bit clunky but it works and will do for now
   */
  getHillSegments() {

    const hills = this.properties.stats.hills;
    const segments = [];

    //if the path starts with a hill then push that before looping
    if (hills[0].startPoint !== 0 ) {
      segments.push({colour: FLAT_COLOUR, start: 0, end: hills[0].startPoint})
    };
    // loop through the hills array
    for (let i = 0, iMax = hills.length - 1; i <= iMax; i++) {
      // push the current hill
      segments.push({colour: hills[i].aveGrad > 0 ? UP_COLOUR : DOWN_COLOUR, start: hills[i].startPoint, end: hills[i].endPoint});
      // push the next flat
      if (i !== iMax) {
        if (hills[i].endPoint !== hills[i+1].startPoint) {
          segments.push({colour: FLAT_COLOUR, start: hills[i].endPoint, end: hills[i+1].startPoint});
        }
      } else {
        if (hills[i].endPoint !== this.lngLats.length-1) {
          segments.push({colour: FLAT_COLOUR, start: hills[i].endPoint, end: this.lngLats.length-1});
        }
      }
    }

    return segments;

  }

  // returns a geoJson feature for the provided coordinates, elevations and colour
  // called only by the child classes below
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

module.exports = {GeoJSON}
