
var chai = require("chai");
var expect = require('chai').expect;
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

const Route = require('./_Path').Route;
const fs = require('fs');


before( function() {
  return getTests('./test-data/_test-def.js').then( function(T) {
    testList = T;
  })
})

it('shoud equal 1', function () { // a hack to get the 'before' to deliver promisified data

  let testWithData = function (test) {
    // this is a closure to define the actual tests - needed to cope with a loop of tests each with promises

    return function () {
      before( function() {
        return getPath('./test-data/'+test.filename+'.js').then(function(P) {
          Path = P;
        });
      });

      it('should have category ' + test.category, function() {
        expect(Path.category).to.equal(test.category);
      });

      it('should have direction ' + test.direction === "" ? "none": test.direction, function() {
          expect(Path.direction).to.equal(test.direction);
      });
    };
  }; // testWithData

  testList.forEach( function(testInfo) {
    // this loops through all the provided test cases, using the closure as an argument
    describe("Testing file: " + testInfo.filename , testWithData(testInfo));
  });

}) // it (hack)

function getPath(fn) {
  // returns Path object created from gpx import stored in provided file
  return new Promise ( (res, rej) => {
    fs.readFile(fn, (err, data) => {
      const testObject = JSON.parse(data);
      const Path = new Route(testObject.nameOfPath, undefined, testObject.lngLat, testObject.elev);
      res(Path);
    });
  })
}

function getTests(fn) {
  return new Promise ( (res, rej) => {
    fs.readFile(fn, (err, data) => {
      res(JSON.parse(data));
    });
  })
}
