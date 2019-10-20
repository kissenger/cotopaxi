
const outerBoundingBox = require('./geoLib.js').outerBoundingBox;
const getRandomColour = require('./utils.js').getRandomColour;
const getContourPalette = require('./utils.js').getContourPalette;


class GeoJson{

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
   */
  constructor(pathDocuments, plotType, matchDocument) {

    pathDocuments = pathDocuments instanceof Array ? pathDocuments : [pathDocuments];
    this.paths = pathDocuments.map(doc => {
      const segments = doc.geometry.coordinates;
      return segments[0][0][0] ? segments : [segments];
    });
    this.plotType = plotType;
    this.features = [];

    if (plotType === 'route' || plotType === 'tracks' ) {
      this.pathProps = pathDocuments.map(doc => this.getPathProps(doc));
      this.stats = pathDocuments[0].stats;
      this.bbox = outerBoundingBox(pathDocuments.map(x => x.stats.bbox));
      this.getUncolouredFeatures();
    } else {
      this.pathProps = [{}];
      this.stats = matchDocument.stats;
      this.bbox = pathDocuments[0].stats.bbox;
      this.nmatch = matchDocument.params.nmatch;
      this.getColouredFeatures();
    }

    //console.log(this.stats);
    //console.log();

    return  {
      type: 'FeatureCollection',
      bbox: this.bbox,
      features: this.features,
      properties: {
        pathId: pathDocuments[0]._id,
        ...this.pathProps[0],
        ...this.stats
      }
    }

  }

  /**
   * Gets GeoJson features for uncoloured path, ie tracks and route, where
   * a uniform colour is expected per provided path
   * No inputs as operates on the class variables
   */
  getUncolouredFeatures() {

    // this approach means all tracks/routes are plotted in the same colour
    // const colour = this.plotType === 'route' ? '#FF0000' : getRandomColour();
    // for (let iPath = 0; iPath < this.paths.length; iPath++) {
    //   for (let iSeg = 0; iSeg < this.paths[iPath].length; iSeg++) {
    //     this.features.push(this.getGeoJsonFeature(colour, iPath, iSeg));
    //   }
    // }

    // this approach means all routes are red; all tracks are different (random) colour
    let colour;
    for (let iPath = 0; iPath < this.paths.length; iPath++) {
      for (let iSeg = 0; iSeg < this.paths[iPath].length; iSeg++) {
        colour = this.plotType === 'route' ? '#FF0000' : getRandomColour();
        this.features.push(this.getGeoJsonFeature(colour, iPath, iSeg));
      }
    }

  }


  /**
   * Returns an array of features coloured by number of visits
   * NOTE that only a single path should be present when contour or binary is invoked
   * hence function operates only on this.paths[0]
   *
   * KNOWN BUGS
   *  1) doesn't work for segment length of 2 because as i>1 in order to print, it
   *     never prints anything.
   */
  getColouredFeatures() {

    const contour = this.getContourProps();
    for (let is = 0; is < this.paths[0].length; is++) {

      let i0 = 0, c0;
      for (let i = 1, n = this.paths[0][is].length; i < n; i++) {

        const cIndex = this.getColourIndex(is, i, contour);
        if ( i > 1 && cIndex !== c0 || i === n - 1 ) {
          const endSlice = i === n - 1 ? i + 2 : i;
          const colour = c0 === -1 ? '#000000' : contour.colours[c0];
          this.features.push(this.getGeoJsonFeature(colour, 0, is, i0, endSlice));
          i0 = i - 1;
        }

        c0 = cIndex;
      }
    }

  } // plotContour


  /**
   * Class containing a single GeoJson segment
   * @param {string} colour desired colour of line
   * @param {object} ip index of the path on this.paths to extract from
   * @param {object} is index of the segment on the current path to extract from
   * @param {object} s0 index of point at which to start slice
   * @param {object} s1 index of point at which to end slice
   */
  getGeoJsonFeature (colour, ip, is, s0, s1) {

    let start = s0 ? s0 : 0;
    let end = s1 ? s1 : this.paths[ip][is].length;

    return {
      type: 'Feature',
      geometry: {
        type: 'Linestring',
        coordinates: this.paths[ip][is].slice(start, end)
      },
      properties: {
        plotType: this.plotType,
        color: colour,
        ...this.pathProps[ip]
      }
    }
  }

  /**
   * Returns the colour index (or the current level) of a provided point (as indexes on this.paths)
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
   * will only be a single nmatch, hence dont need to loop through paths#
   */
  getContourProps() {

    const nContourLevels = 11;
    const nLevels = this.plotType === 'binary' ? 2 : nContourLevels;
    let min = 9999, max = -1;

    // loop through all point on each segment on each path
    for (let is = 0, n = this.paths[0].length; is < n; is++) {
      for (let i = 1, m = this.paths[0][is].length; i < m; i++) {
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
  getPathProps(doc) {
    return {
      userId: doc.userId,
      pathType: doc.pathType,
      category: doc.category,
      startTime: doc.startTime,
      creationDate: doc.creationDate,
      description: doc.description,
      direction: doc.direction,
       name: doc.name
      // name: doc.name.length === 0 ? doc.category + ' ' + doc.pathType : doc.name,
    }
  }

}



module.exports = {
  GeoJson
}
