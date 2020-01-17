

export interface tsElevations{
    elevationStatus: string,
    elevs: Array<number>
}


export interface pathStats{
    distance: number,
    nPoints: number,
    elevations?: {
        elevationStatus: string,
        ascent: number,
        descent: number,
        lumpiness: number,
        maxElev: number,
        minElev: number,
        badElevData: boolean
    };
}


export interface tsCoordinate {
    lat: number,
    lng: number,
    elev?: number
}


export interface myElevationQuery {
    options?: {
        interpolate?: boolean,
        writeResultsToFile?: boolean
    },
    coordsArray: Array<tsCoordinate>
}


export interface myElevationResults {
    result: Array<tsCoordinate>
}

// export interface tsFeatureCollection {
//     bbox: tsBoundingBox,
//     type: 'FeatureCollection',
//     features: Array<tsFeature>,
//     properties: {}
// }



// export interface tsLineString {
//     type: "LineString";
//     coordinates: [[Number]];
// }


// export interface tsFeature {
//     bbox?: tsBoundingBox,
//     type: 'Feature',
//     geometry: tsLineString,
//     properties: {}
// }

// export interface tsBoundingBox {
//     minLng: Number,
//     maxLng: Number,
//     minLat: Number,
//     maxLat: Number
// }

// export interface tsProperties{
//     info: tsInfo,
//     params: tsParams,
//     stats: tsStats,
//     colour?: String,
//     creationDate?: String,
//     lastEditDate?: String,
//     plotType?: String,
//     userID?: String
// }

// export interface tsInfo {
//     direction: String,
//     category: String,
//     nationalTrail: Boolean,  
//     name: String, 
//     description: String,
//     pathType: String,           // 'route' or 'track'
//     startTime: String,    
// }

// export interface tsParams {
//     elev: Array<Number>,
//     time: Array<Number>,
//     heartRate: Array<Number>,
//     cadence: Array<Number>
// }

// export interface tsStats {
//     bbox: {
//         minLng: Number,
//         minLat: Number,
//         maxLng: Number,
//         maxLat: Number
//     },
//     nPoints: Number,
//     duration: Number,
//     distance: Number,
//     pace:  Number,
//     elevations: {
//         ascent: Number,
//         descent: Number,
//         maxElev: Number,
//         minElev: Number,
//         lumpimess: Number,
//         distance: Number,
//         nPoints: Number,
//         badElevData?: Boolean
//     },
//     p2p: {
//         max: Number,
//         ave: Number
//     },
//     movingStats: {
//         movingTime: Number,
//         movingDist: Number,
//         movingPace: Number,
//     },
//     hills: [ {
//         dHeight: Number,
//         dDist: Number,
//         dTime: Number,
//         pace: Number,
//         ascRate: Number,
//         gradient: {
//             max: Number,
//             ave: Number
//         } 
//         } ],
//     splits: {
//         kmSplits: Array<Array<Number>>,
//         mileSplits: Array<Array<Number>>
//     }
// }

