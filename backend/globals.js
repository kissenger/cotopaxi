

DEBUG = true;
SIMPLIFY_TOLERANCE = 6;       // metres offset from a line below which a point will be deleted; higher tol -> greater simplification
LONG_PATH_THRESHOLD = 4000;   // number of points (before simplification) above which the path will be treated as long
MATCH_DISTANCE = 100;         // metres; if distance between two points is less than this they will be treated as matching
MATCH_BUFFER = 10;                 // number of points ahead to skip when finding match (to avoid matching point in the same direction)

MOVING_AVERAGE_PERIOD = 7 // smoothing factor for moving average (must be odd)
ASCENT_THRESH = 5         // changes in altitude < this will not be included in ascent/descent calculation
HILL_THRESH = 30          // changes in altitude > this will be considered as a hill


module.exports = {
  SIMPLIFY_TOLERANCE,
  LONG_PATH_THRESHOLD,
  MATCH_DISTANCE,
  MATCH_BUFFER,
  DEBUG,
  MOVING_AVERAGE_PERIOD,
  ASCENT_THRESH,
  HILL_THRESH
}
