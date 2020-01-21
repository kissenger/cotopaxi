

// export interface tsElevations{
//     elevationStatus: string,
//     elevs: Array<number>
// }

export interface tsPlotPathOptions{
    booResizeView: boolean,
    booReplaceExisting: boolean,
    booSaveToStore: boolean
}

export interface tsMapboxLineStyle{
    lineWidth: number
    lineColor: string
    lineOpacity: number
}

export interface pathStats{
    distance: number,
    nPoints: number,
    elevations?: {
        ascent: number,
        descent: number,
        lumpiness: number,
        maxElev: number,
        minElev: number
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

