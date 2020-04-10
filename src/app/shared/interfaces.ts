
// export interface tsElevations{
//     elevationStatus: string,
//     elevs: Array<number>
// }

// export interface Array<T> {
//   lastElement(elem: T): Function;
// }

// Array.prototype.lastElement = function() {
//   return 1;
// };

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

// invalid is used to indicate hhome location has not been set
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
  homeLngLat?: TsCoordinate;
  isHomeLocSet?: boolean;
  email: string;
  units: TsUnits;
  password?: string;
  _id?: string;
}

export interface TsFeatureCollection {
    bbox: TsBoundingBox;
    type: 'FeatureCollection';
    features: Array<TsFeature>;
    properties: TsProperties;
}



export interface TsLineString {
    type: 'LineString';
    coordinates: Array<Array<number>>;
}

export interface TsBoundingBox extends Array<number> {}

export interface TsFeature {
    bbox?: TsBoundingBox;
    type: 'Feature';
    geometry: TsLineString;
    properties: TsProperties;
}

export interface TsProperties {
    pathId: string;
    info: TsInfo;
    params: TsParams;
    stats: TsStats;
    colour?: string;
    creationDate?: string;
    lastEditDate?: string;
    plotType?: string;
    userID?: string;
}

export interface TsInfo {
    direction: string;
    category: string;
    nationalTrail: boolean;
    name: string;
    description: string;
    pathType: string;           // 'route' or 'track'
    startTime: string;
    isLong: boolean;
}

export interface TsParams {
    elev: Array<number>;
    time: Array<number>;
    heartRate: Array<number>;
    cadence: Array<number>;
    cumDistance: Array<number>;
}

export interface TsStats {
    bbox: {
        minLng: number,
        minLat: number,
        maxLng: number,
        maxLat: number
    };
    nPoints: number;
    duration: number;
    distance: number;
    pace:  number;
    elevations: {
        ascent: number,
        descent: number,
        maxElev: number,
        minElev: number,
        lumpiness: number,
        distance: number,
        nPoints: number,
        badElevData?: boolean
    };
    p2p: {
        max: number,
        ave: number
    };
    movingStats: {
        movingTime: number,
        movingDist: number,
        movingPace: number,
    };
    hills: Array<TsHills>;
    splits: {
        kmSplits: Array<Array<number>>,
        mileSplits: Array<Array<number>>
    };
}

interface TsHills {

      dHeight?: number;
      dDist?: number;
      dTime?: number;
      pace?: number;
      ascRate?: number;
      gradient?: {
          max?: number;
          ave?: number
      };
}

