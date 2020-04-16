
const simplify = require('./geoLib.js').simplify;
const boundingBox = require('./geoLib').boundingBox;

class Point {

  constructor(array) {
    this.lng = array[0][0];
    this.lat = array[0][1];
    if ( typeof array[1] !== 'undefined' ) this.elev = array[1];
    if ( typeof array[2] !== 'undefined' ) this.time = array[2];
    if ( typeof array[3] !== 'undefined' ) this.hr = array[3];
    if ( typeof array[4] !== 'undefined' ) this.cad = array[4];
  }

  addElevation(e) {
    this.elev = e;
  }
}

class Points {

  constructor(coords, elevs = []) {
    // create an array of point instances
    this.points = coords.map( (coords, elevs) => new Point(coords[i], elevs[i]))
    // this.elevations = elevs;
    // coords.map

    distArr = coords.map( (p, i) => (i === 0 ? 0 : p2p(this.points[i], this.points[i-1]) ));
    cumDist = distArr.map( (p,i) => array.slice(0, i + 1).reduce( (sum, d) => sum + d, 0) );
  }


  // return an array of the elevations that exist on the points (may be shorter than the points array)
  elevs() {
    return this.elevations;
  }

  getPointsArray(c, e) {
    return this.c.map( (c, i) => new Point(c[i], this.elevs[i]));
  }

  // getPoint(i) {
  //   return new Point(this.coords[i], this.elevs[i]);
  // }

  isElevations() {
    return this.elevs.length > 0;
  }

  discardElevs() {
    this.elevs = [];
  }

  boundingBox() {
    return this.boundingBox(this.points);
  }



  length() {
    return this.coords.length;
  }

  pointsWithoutElevs() {
    return this.points.filter( point => !!point.elev);
  }

  isElevsComplete() {
    return this.pointsWithoutElevs().length === 0;
  }

  addNewElevs(newElevs) {
    this.pointsWithoutElevs().map( (p, i) => p.addElevation(newElevs[i]));
  }

  /**
   * Apply low pass filter to elevation data
   * TODO, can map be used?
   */
  getSmoothedElevations() {

    const ALPHA = 0.35;
    const elevs = this.elevs()

    const smoothedElevs = [elevs[0]];
    for (let i = 1, max = elevs.length; i < max; i++) {
      smoothedElevs.push( elevs[i] * ALPHA + smoothedElevs[i-1] * ( 1 - ALPHA ) );
    }
    return smoothedElevs;
  }

}

module.exports = {
  Points
};

