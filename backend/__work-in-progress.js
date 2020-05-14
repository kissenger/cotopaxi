

class Parameter{


  constructor(source, array) {


  }

  _assessQuality() {
    const numberOfNulls = this._elevations.filter( e => e === null);
    if (numberOfNulls > this.length * 0.1) {
      //discard elevations
    } else {
      this._fillInNulls();
    }
  }

  get length() {
    return this._elevations.length;
  }

}

class Elevation extends Parameter {

  constructor(source, elevations) {
    this._elevations = elevations;
    this._source = source;
  }

  get smoothed() {
    return this._elevations;
  }
}

class Coordinates extends Parameter {
  constructor(lngLats) {

  }
}

class Elevations {

  constructor(source, elevations) {
    this._elevations = elevations;
    this._source = source;
    this._quality = ( this._elevations.filter(e => e === null) / this.length ).toFixed(2);
  }

  _fillInNulls() {

    this._elevations.forEach() {

    }
  }

}





export function analyseElevations() {

  if (!this.isParamExistsOnAnyPoint('elev')) {
    return {};
  }

  // distance data needed to caculate gradients
  const dDistance = this._distanceData.dDistance;
  const distance = this._distanceData.distance;
  const cumDistance = this.cumulativeDistance;

  // const elevations = this.getParamFromPoints('elev');
  const smoothedElevations = getSmoothedElevations.apply(this);
  const grads = smoothedElevations.map( (e, i, eArr) => i === 0 ? 0 : (e - eArr[i-1]) / dDistance[i] * 100 );

  const {ascent, descent, hills} = getHillStats();

  // get stats for each hill in the list
  const hills = hillsArr.map( hill => ({
      dHeight: smoothedElevations[hill[1]] - smoothedElevations[hill[0]],
      dDist: cumDistance[hill[1]] - cumDistance[hill[0]],
      maxGrad: Math.max( ...grads.slice(hill[0], [hill[1]+1]).map( g => Math.abs(g) ) ),
      aveGrad: (smoothedElevations[hill[1]] - smoothedElevations[hill[0]]) / (cumDistance[hill[1]] - cumDistance[hill[0]]) * 100,
      startPoint: hill[0],
      endPoint: hill[1]
    })
  );

  return {
    smoothedElev: smoothedElevations,
    elevations: {
      ascent,
      descent,
      maxElev: Math.max(...smoothedElevations),
      minElev: Math.min(...smoothedElevations),
      lumpiness: (ascent - descent) / distance
    },
    hills
  }

}


function getSmoothedElevations() {

  const isPathReallyShort = () => this.length < (globals.MOVING_AVERAGE_PERIOD * 2);
  const elevations = this.getParam('elev');

  if (isPathReallyShort()) {
    return elevations;
  } else {
    return movingAverage(elevations, globals.MOVING_AVERAGE_PERIOD)
  }

}


/**
 * Moving average function, used to smooth elevations
 * Note that number of points to average over is smaller at the start and end of the
 * array, due to the way I have chosen to implement it
 */
function movingAverage(array, period) {

  if (period % 2 === 0) throw Error('Moving average period should be odd');

  const shift = (period - 1) / 2;
  const movingAverage = array.map( (p, i, arr) => {
    const low = Math.max(i - shift, 0);
    const upp = Math.min(i + shift + 1, array.length);
    return arr.slice(low, upp).reduce((a,b) => a + b, 0) / (upp - low);
  })

  return movingAverage;

}


// returns {ascent: xx, descent: xx, hills: []}
function getHillStats(elevs) {

  return elevs.reduce( (result, _, i, elevs) => {

    if (i === 0) return;

    const de = elevs[i] - elevs[i-1];
    if (Math.sign(dSum) === Math.sign(de)) {
      dSum += de;
      hillSum += de;
    } else {
      if (Math.abs(dSum) > globals.ASCENT_THRESH) {
        if (dSum > 0) { result.ascent += dSum; }
        else { result.descent += dSum; }
      }
      if (Math.abs(hillSum) > globals.HILL_THRESH) {
        result.hills.push([p0 - 1, i - 1]);
      }
      dSum = de;
      hillSum = de;
      p0 = i;
    }

  }, {ascent: 0, descent: 0, hills: []})

    // check we didnt end on a hill
    if (Math.abs(dSum) > globals.ASCENT_THRESH) {
      if (dSum > 0) { ascent += dSum; }
      else { descent += dSum; }
    }
    if (Math.abs(hillSum) > globals.HILL_THRESH) {
      hillsArr.push([p0 - 1, this.nPoints - 1]);
    }


}


