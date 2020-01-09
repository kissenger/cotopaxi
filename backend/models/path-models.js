const mongoose = require('mongoose');

const pathSchema = mongoose.Schema({

  userId: {type: String, required: true},
  creationDate: {type: Date, default: Date.now},
  lastEditDate: {type: Date, default: Date.now},
  isSaved: {type: Boolean, default: false},

  // geometric information defining the path, in geoJSON format to aid searching
  geometry: {                                        
    type: {type: String, required: true},
    coordinates: {type: [[Number]], required: true}
  }, 

  // params are the additional parameters from the recording devi
  params: {
    elev: {type: [Number]},
    time: {type: [Number]},
    heartRate: {type: [Number]},
    cadence: {type: [Number]}
  },

  // user entered information to describe/tag route
  info: {
    direction: {type: String},
    category: {type: String},
    nationalTrail: {type: Boolean},  
    name: {type: String}, 
    description: {type: String},
    pathType: {type: String},           // 'route' or 'track'
    startTime: {type: String},
  },

  // listStats: {
  //   name: {type: String},
  //   category: {type: String},
  //   startTime: {type: String},
  //   distance: {type: Number},
  //   pathDuration: {type: Number},
  //   matchDistance: {type: Number},
  // },

  // statistics calculated from the device data
  stats: {
    bbox: {
      minLng: Number,
      minLat: Number,
      maxLng: Number,
      maxLat: Number
    },
    nPoints: {type: Number},
    duration: {type: Number},
    distance: {type: Number},
    pace: {type: Number},
    elevations: {
      elevationStatus: {type: String},
      ascent: {type: Number},
      descent: {type: Number},
      maxElev: {type: Number},
      minElev: {type: Number},
      lumpiness: {type: Number},
      badElevData: {type: Boolean}     
    },
    p2p: {
      max: {type: Number},
      ave: {type: Number}
    },
    movingStats: {
      movingTime: {type: Number},
      movingDist: {type: Number},
      movingPace: {type: Number},
    },
    hills: {type: [
      { dHeight: {type: Number},
        dDist: {type: Number},
        dTime: {type: Number},
        pace:  {type: Number},
        ascRate: {type: Number},
        gradient: {
          max: {type: Number},
          ave: {type: Number}
        }
      }
    ]},
    splits: {
      kmSplits: {type: [[Number]]},
      mileSplits: {type: [[Number]]}
    }

  }

})

pathSchema.index({ userId: 1, creationDate: 1});
pathSchema.index({ userId: 1, startTime: 1});

//const Challenges = mongoose.model('challenges', pathSchema);
const Tracks = mongoose.model('tracks', pathSchema);
const Routes = mongoose.model('routes', pathSchema);


module.exports = {
  Tracks: Tracks,
  Routes: Routes
};
