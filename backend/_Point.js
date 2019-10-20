
class Point {

  constructor(array) {
    this.lng = array[0][0];
    this.lat = array[0][1];
    if ( typeof array[1] !== 'undefined' ) this.elev = array[1];
    if ( typeof array[2] !== 'undefined' ) this.time = array[2];
    if ( typeof array[3] !== 'undefined' ) this.hr = array[3];
    if ( typeof array[4] !== 'undefined' ) this.cad = array[4];
  }

}

module.exports = {
  Point
};

