
const readline = require('readline');
const progressBar = require('./utils.js').progressBar;

/**
 * Returns a colour selected at random, in hex rgb format
 */
function getRandomColour() {
  const letters = '456789ABCDEF';
  var colour = '#';
  for (var j = 0; j < 6; j++) {
    colour += letters[Math.floor(Math.random() * letters.length)];
  }
  return colour;
}

/**
 *
 * @param {*} nLevels
 */
function getContourPalette(nLevels) {

  const highColour = '0000FF'; //blue
  const lowColour = 'FFFFFF';

  // populate array with reqd steps as ratio 0 --> 1
  var levels = [];
  while (levels.length < nLevels) levels.push(levels.length/(nLevels-1));

  // convert colour strings to rgb and interpolate to levels
  rgbArray = levels.map(x => getRGB(highColour,lowColour,x));

  // with converted rgb array, construct new colour HEXs
  var hexArray = [];
  rgbArray.forEach( (rgb) => {
    s = '#';
    rgb.forEach( (x) => {
      s = s + padInt(x.toString(16), 2);
    })
    hexArray.push(s);
  })

  return hexArray;

}

function getRGB(c1, c2, ratio) {
  var r = Math.ceil(parseInt(c1.substring(0,2), 16) * ratio + parseInt(c2.substring(0,2), 16) * (1-ratio));
  var g = Math.ceil(parseInt(c1.substring(2,4), 16) * ratio + parseInt(c2.substring(2,4), 16) * (1-ratio));
  var b = Math.ceil(parseInt(c1.substring(4,6), 16) * ratio + parseInt(c2.substring(4,6), 16) * (1-ratio));
  return [r, g, b];
}

function padInt(num, size) {
  var s = num;
  while (s.length < size) s = '0' + s
  return s;
}



class ProgressBar{

  constructor(min, max, nDivs) {

    this.min = min;
    this.max = max;
    this.nDivs = nDivs;
    this.delta = (max - min) / nDivs;

    this.increment(0);

  }

  increment(value) {

    const nDots = Math.ceil((value - this.min) / this.delta);
    const nSpaces = this.nDivs - nDots;

    const dotStr   = new Array(nDots+1).join(":");
    const spaceStr = new Array(nSpaces+1).join(" ");

    readline.clearLine(process.stdout, 0)
    readline.cursorTo(process.stdout, 0, null)
    process.stdout.write("|" + dotStr + spaceStr + "|");
  }

  finished() {
    process.stdout.write('\n');
  }

}

module.exports = {
  getRGB,
  padInt,
  getContourPalette,
  getRandomColour,
  ProgressBar

};
