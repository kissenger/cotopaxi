// const assert = require('assert');

import { use } from "chai";
import { expect } from 'chai';
import chaiAsPromised from "chai-as-promised";
use(chaiAsPromised);

import { Route } from './_Path';
import { readFile } from 'fs';

// before( function() {
//   return getTests('./defTest.js').then( function(retArr) {
//     console.log(retArr);
//     testArr = retArr;
//   })
// });

// for (let i = 0; i < testArr.length; i++) {



getTests('./test-data/_defTest.js').then( function(testArr) {

  console.log('1', testArr);
  testArr.forEach( (test) => {

    describe('outer describe', function() {
      console.log('2a')

      before( function() {
        console.log('2', test.filename);
        return getPath(test.filename+'.js').then(function(P) {
          console.log('3', P.category);
          Path = P;
        });
      });

      describe(test.filename, function() {
        it('should have category ' + test.category, function() {
          expect(Path.category).to.equal(test.category);
        });

        it('should have direction ' + test.direction, function() {
            expect(Path.direction).to.equal(tes.direction);
        });

        // it('should have ascent roughly equal to descent', function () {
        //   expect(Path1.stats.elevations.ascent).to.be.greaterThan(Path1.stats.elevations.descent*0.9);
        //   expect(Path1.stats.elevations.ascent).to.be.lessThan(Path1.stats.elevations.descent*1.1);
        // })

      });  // describe
    });
  });  // forEach
});  // describe



function getTests(fn) {
  return new Promise ( (res, rej) => {
    readFile(fn, (err, data) => {
      res(JSON.parse(data));
    });
  })
}

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
