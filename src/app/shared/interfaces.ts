

// export interface tsElevations{
//     elevationStatus: string,
//     elevs: Array<number>
// }

export interface TsUnits {
    distance: 'miles' | 'kms';
    elevation: 'm' | 'ft';
}

export interface TsPlotPathOptions {
    booResizeView?: boolean;
    booSaveToStore?: boolean;
    booPlotMarkers?: boolean;
}

export interface TsLineStyle {
    lineWidth?: number;
    lineColour?: string;
    lineOpacity?: number;
}

export interface TsPathStats {
    // distance: number;
    // nPoints: number;
    // elevations?: {
    //     ascent: number;
    //     descent: number;
    //     lumpiness: number;
    //     maxElev: number;
    //     minElev: number;
    // };
    // hills?: Array<TsHill>;

      bbox?: {
        minLng: number;
        minLat: number;
        maxLng: number;
        maxLat: number;
      };
      nPoints?: number;
      duration?: number;
      distance: number;
      pace?: number;
      elevations?: {
        ascent: number;
        descent: number;
        maxElev: number;
        minElev: number;
        lumpiness: number;
      };
      p2p?: {
        max: number;
        ave: number;
      };
      movingStats?: {
        movingTime: number;
        movingDist: number;
        movingPace: number;
      };
      hills?: Array<TsHill>;
      splits?: {
        kmSplits: number;
        mileSplits: number;
      };

  }

interface TsHill {
  dHeight: number;
  dDist: number;
  startDist: number;
  startPoint: number;
  endPoint: number;
  dTime: number;
  pace: number;
  ascRate: number;
  maxGrad: number;
  aveGrad: number;
}

interface TsListItem {
  name: string;
  stats: TsPathStats;
  category: string;
  direction: string;
  pathType: string;
  startTime: string;
  creationDate: string;
  pathId: string;
  count: number;
  isActive?: boolean;
}

export interface TsListArray extends Array<TsListItem> {}


export interface TsCoordinate {
  lat: number;
  lng: number;
  elev?: number;
  invalid?: boolean;
}


interface TsTab {
  active: boolean;
  name: string;
  component: any;
}

export interface TsTabsArray extends Array<TsTab> {}

export interface TsElevationQuery {
    options?: {
        interpolate?: boolean,
        writeResultsToFile?: boolean
    };
    coords: Array<TsCoordinate>;
}


export interface TsElevationResults extends Array<TsCoordinate> {}

export interface TsUser {
  userName: string;
  homeLngLat: Array<number>;
  email: string;
  _id: string;
}

// export interface tsFeatureCollection {
//     bbox: tsBoundingBox,
//     type: 'FeatureCollection',
//     features: Array<tsFeature>,
//     properties: {}
// }



// export interface tsLineString {
//     type: "LineString";
//     coordinates: [[number]];
// }


// export interface tsFeature {
//     bbox?: tsBoundingBox,
//     type: 'Feature',
//     geometry: tsLineString,
//     properties: {}
// }

// export interface tsProperties{
//     info: tsInfo,
//     params: tsParams,
//     stats: tsStats,
//     colour?: string,
//     creationDate?: string,
//     lastEditDate?: string,
//     plotType?: string,
//     userID?: string
// }

// export interface tsInfo {
//     direction: string,
//     category: string,
//     nationalTrail: boolean,
//     name: string,
//     description: string,
//     pathType: string,           // 'route' or 'track'
//     startTime: string,
// }

// export interface tsParams {
//     elev: Array<number>,
//     time: Array<number>,
//     heartRate: Array<number>,
//     cadence: Array<number>
// }

// export interface tsStats {
//     bbox: {
//         minLng: number,
//         minLat: number,
//         maxLng: number,
//         maxLat: number
//     },
//     nPoints: number,
//     duration: number,
//     distance: number,
//     pace:  number,
//     elevations: {
//         ascent: number,
//         descent: number,
//         maxElev: number,
//         minElev: number,
//         lumpimess: number,
//         distance: number,
//         nPoints: number,
//         badElevData?: boolean
//     },
//     p2p: {
//         max: number,
//         ave: number
//     },
//     movingStats: {
//         movingTime: number,
//         movingDist: number,
//         movingPace: number,
//     },
//     hills: [ {
//         dHeight: number,
//         dDist: number,
//         dTime: number,
//         pace: number,
//         ascRate: number,
//         gradient: {
//             max: number,
//             ave: number
//         }
//         } ],
//     splits: {
//         kmSplits: Array<Array<number>>,
//         mileSplits: Array<Array<number>>
//     }
// }

