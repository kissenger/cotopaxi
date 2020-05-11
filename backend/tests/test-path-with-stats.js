
/**
 * To run: 'mocha point-tests'
 */

// const expect = require('chai').expect;
// const Point = require('geo-points-and-paths').Point;
// const Path = require('geo-points-and-paths').Path;
// const geoFunctions = require('geo-points-and-paths').geoFunctions;
import chai from 'chai';
import { PathWithStats } from '../class-path-with-stats.js';


var expect = chai.expect;

// some param strings for reference
// {"lat":51.2194,"lng":-3.94915}
// {"lat":51.2194,"lng":-3.94915, "elev": 50, "HR": 136, "Cadence": 95};

const lngLatsInput = [
  [51.2194,-3.94915],
  [51.21932,-3.94935],
  [51.21919,-3.94989],
  [51.21905,-3.95032],
  [51.219,-3.95043],
  [51.21893,-3.95052],
  [51.21856,-3.95088],
  [51.21835,-3.95112],
  [51.21825,-3.95132],
  [51.21819,-3.95147],
  [51.21804,-3.95236],
  [51.21804,-3.95255],
  [51.21808,-3.953],
  [51.2181,-3.95338],
  [51.21808,-3.95372],
  [51.21795,-3.95445],
  [51.21794,-3.95477],
  [51.2179,-3.95511],
  [51.21774,-3.95564],
  [51.21769,-3.95615]
];


const elevs = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20];
/**
 * Path Instantiation
 */
describe(`Correctly instantiating PathWithStats`, function() {

  describe(`Instantiating a path`, function() {

    const path = new PathWithStats(lngLatsInput, elevs);
    console.log(path)

    it('should return an instance of PathWithStats', function() {
      expect(path).to.satisfy(function(r) { return r instanceof PathWithStats });
    });

    it('should return array of latlngs', function() {
      expect(path.lngLats).to.deep.equal(lngLatsInput);
    });

    console.log(path.lngLats);

  })

})

