// const assert = require('assert');

import { use } from "chai";
import { expect } from 'chai';
import chaiAsPromised from "chai-as-promised";
use(chaiAsPromised);

import { Route } from './_Path';
import { readFile } from 'fs';

  before( function() {
    console.log('before 1');
    return getPath('./test-data/boa-wheel.js').then(function(P) {
      console.log(P);
      Path1 = P;
    });
  });

  describe('Boa wheel', function() {
    it('should have category equal to Circular', function() {
      console.log(Path1.category);
      expect(Path1.category).to.equal('Circular');
    });

    it('should have direction Anti-Clockwise', function() {
        expect(Path1.direction).to.equal('Anti-Clockwise');
    });

    it('should have ascent roughly equal to descent', function () {
      expect(Path1.stats.elevations.ascent).to.be.greaterThan(Path1.stats.elevations.descent*0.9);
      expect(Path1.stats.elevations.ascent).to.be.lessThan(Path1.stats.elevations.descent*1.1);
    })

  });

  before( function() {
    console.log('before 2');
    return getPath('./test-data/mendip-way.js').then(function(P) {
      Path2 = P;
    });
  });

  describe('Mendip Way', function() {
    it('should have category equal to One way', function() {
        expect(Path2.category).to.equal('One way');
    });

    it('should have direction West to East', function() {
        expect(Path2.direction).to.equal('West to East');
    });

  });



function getPath(fName) {

  return new Promise ( (res, rej) => {
    readFile(fName, (err, data) => {
      const testObject = JSON.parse(data);

      const Path = new Route(testObject.nameOfPath, undefined, testObject.lngLat, testObject.elev);
      console.log(Path.direction);
      res(Path);
    });
  })

}
