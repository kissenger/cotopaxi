
const outerBoundingBox = require('./geoLib.js').outerBoundingBox;
const getRandomColour = require('./utils.js').getRandomColour;
const getContourPalette = require('./utils.js').getContourPalette;
const timeStamp = require('./utils.js').timeStamp;
const DEBUG = true;

class GeoJSON{

  /**
   * Returns a GeoJson feature collection object froma  Mongo document input
   * @param {Mongo Document} pathDocuments REQUIRED can be array of docs or single doc returned from mongo
   * @param {string} plotType REQUIRED 'tracks', binary', 'contour' or 'route'
   * @param {Mongo Document} matchDocument OPTIONAL for 'route' or tracks', REQUIRED for 'binary' and 'contour'. NOT an array
   *
   * Notes
   * 'route' is a single path document with one or more segments
   * 'binary and 'contour' is a single path document with one or more segments, supplied with mongo match document
   * 'tracks' is an array of path documents, each with a single lnglat segment
   * if >1 document is supplied for route then assume they are segments of the same path; if track then each is a seperate track
   */
  constructor(pathDocs, plotType, matchDocument) {
    
    
    // initialise some stuff
    if (DEBUG) { console.log(timeStamp() + ' >> Creating a new GeoJSON instance '); }
    this.plotType = plotType;
    this.features = []; // gets populated by call to getIsoColourFeature() of getMutiColourFeature()

    // Ensure that pathDocs is an array, then loop through each element pulling lngLats into a simple array
    pathDocs = pathDocs instanceof Array ? pathDocs : [pathDocs];
    this.lngLats = pathDocs.map( doc => {
      const segments = doc.geometry.coordinates;
      return segments[0][0][0] ? segments : [segments];
    });

     // simple route or track
    if (plotType === 'route' || plotType === 'track' ) {
      this.properties = [];
      this.bboxes = [];
      pathDocs.forEach( doc => {
        this.properties.push(this.getProperties(doc));
        this.bboxes.push(doc.stats.bbox);
      });
      this.bbox = outerBoundingBox(pathDocs.map(x => x.stats.bbox));
      this.getIsoColourFeatures();

    // contour or binary plot
    } else {
      this.properties = [{}];
      this.stats = matchDocument.stats;
      this.bbox = pathDocs[0].stats.bbox;
      this.nmatch = matchDocument.params.nmatch;
      this.getMultiColourFeatures();
    }

    // this is a feature collection that wraps up all the lower level features
    // take the first documents properties as the featurecollection props,
    console.log(pathDocs[0]._id);
    return  {
      type: 'FeatureCollection',
      bbox: [this.bbox.minLng, this.bbox.minLat, this.bbox.maxLng, this.bbox.maxLat],
      features: this.features,
      properties: {
       pathId: pathDocs[0]._id,
       ...this.properties[0],
      }
    }

  }

  /**
   * Gets GeoJson features for uncoloured path, ie tracks and route, where
   * a uniform colour is expected per provided path
   * No inputs as operates on the class variables
   */
  getIsoColourFeatures() {

    // this approach means all tracks/routes are plotted in the same colour
    // const colour = this.plotType === 'route' ? '#FF0000' : getRandomColour();
    // for (let iPath = 0; iPath < this.lngLats.length; iPath++) {
    //   for (let iSeg = 0; iSeg < this.lngLats[iPath].length; iSeg++) {
    //     this.features.push(this.getGeoJsonFeature(colour, iPath, iSeg));
    //   }
    // }

    // this approach means all routes are red; all tracks are different (random) colour
    let colour;
    for (let iPath = 0; iPath < this.lngLats.length; iPath++) {
      for (let iSeg = 0; iSeg < this.lngLats[iPath].length; iSeg++) {
        colour = this.plotType === 'route' ? '#FF0000' : getRandomColour();
        this.features.push(this.getGeoJSONFeature(colour, iPath, iSeg));
      }
    }

  }


  /**
   * Returns an array of features coloured by number of visits
   * NOTE that only a single path should be present when contour or binary is invoked
   * hence function operates only on this.lngLats[0]
   *
   * KNOWN BUGS
   *  1) doesn't work for segment length of 2 because as i>1 in order to print, it
   *     never prints anything.
   */
  getMultiColourFeatures() {

    const contour = this.getContourProps();
    for (let is = 0; is < this.lngLats[0].length; is++) {

      let i0 = 0, c0;
      for (let i = 1, n = this.lngLats[0][is].length; i < n; i++) {

        const cIndex = this.getColourIndex(is, i, contour);
        if ( i > 1 && cIndex !== c0 || i === n - 1 ) {
          const endSlice = i === n - 1 ? i + 2 : i;
          const colour = c0 === -1 ? '#000000' : contour.colours[c0];
          this.features.push(this.getGeoJSONFeature(colour, 0, is, i0, endSlice));
          i0 = i - 1;
        }

        c0 = cIndex;
      }
    }

  } // plotContour


  /**
   * Create a feature from a segment of a sclie of the lngLats array
   * @param {string} colour desired colour of line
   * @param {object} ip index of the path on this.lngLats to extract from
   * @param {object} is index of the segment on the current path to extract from
   * @param {object} s0 index of point at which to start slice
   * @param {object} s1 index of point at which to end slice
   */
  getGeoJSONFeature (colour, ip, is, s0, s1) {

    let start = s0 ? s0 : 0;
    let end = s1 ? s1 : this.lngLats[ip][is].length;

    return {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: this.lngLats[ip][is].slice(start, end)
      },
      properties: {
        plotType: this.plotType,
        color: colour,
        ...this.properties[ip]
      }
    }
  }

  /**
   * Returns the colour index (or the current level) of a provided point (as indexes on this.lngLats)
   * @param {int} is index of current segment (path is not relevant for nmatch)
   * @param {int} i index of the current point on the segment
   * @param {object} cProps contour properties object from getContourProperties() function
   */
  getColourIndex(is, i, cProps) {

    let cIndex;
    const lastMatch = this.nmatch[is][i-1];
    const thisMatch = this.nmatch[is][i];

    if (cProps.nLevels === 2) {
      cIndex = (lastMatch !== 0 && thisMatch !== 0) ? 1 : -1;
    } else {
      const minMatches = Math.max(Math.min(lastMatch, thisMatch), 0);
      cIndex = Math.ceil( (minMatches - cProps.min + cProps.shift) /
                          (cProps.max - cProps.min + 2*cProps.shift) * cProps.nLevels) - 1;
      cIndex = minMatches === 0 ? -1 : cIndex;
    }

    return cIndex;

  }


  /**
   * Finds range properties for the current contour plot
   * @param {object} returns range object with keys: min, max, shift, nLevels
   * For contour plot, only a single path is expected, and as such there
   * will only be a single nmatch, hence dont need to loop through lngLats#
   */
  getContourProps() {

    const nContourLevels = 11;
    const nLevels = this.plotType === 'binary' ? 2 : nContourLevels;
    let min = 9999, max = -1;

    // loop through all point on each segment on each path
    for (let is = 0, n = this.lngLats[0].length; is < n; is++) {
      for (let i = 1, m = this.lngLats[0][is].length; i < m; i++) {
        const mintemp = Math.max(this.nmatch[is][i], this.nmatch[is][i-1]);
        const maxtemp = Math.min(this.nmatch[is][i], this.nmatch[is][i-1]);
        min = mintemp < min ? mintemp : min;
        max = maxtemp > max ? maxtemp : max;
      }
    }

    return {
      'min': min,
      'max': max,
      'shift': (max - min) / (nLevels - 1) * 0.5,
      'nLevels': nLevels,
      'colours': getContourPalette(nLevels)
    }
  }

  /**
   * Extracts key properties from path document
   * @param {Mongo Document} doc single mongo path document (not array)
   */
  getProperties(doc) {
    return {
      userId: doc.userId,
      creationDate: doc.creationDate,
      lastEditDate: doc.lastEditDate,
      stats: doc.stats,
      info: doc.info,
      params: doc.params
      // name: doc.name.length === 0 ? doc.category + ' ' + doc.pathType : doc.name,
    }
  }

}

module.exports = {
  GeoJSON
}
