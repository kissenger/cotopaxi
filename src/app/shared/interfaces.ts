
// trailscape coordinate format - used so there is no confusion on use of lat or lng
export interface tsCoordinate {
    lat: number;
    lng: number;
}

export interface pathStats{
    distance: number,
    nPoints: number,
    elevations?: {
        ascent: number,
        descent: number,
        lumpiness: number,
        maxElevation: number,
        minElevation: number,
        badElevData: boolean
    };
}


export interface openElevationResultObject {
    elevations: Array<{
        lat: number,
        lon: number,
        elevation: number
    }>,
    resolution: string
}

export interface openElevationQueryObject {
    points: Array<Array<number>>;
    
}