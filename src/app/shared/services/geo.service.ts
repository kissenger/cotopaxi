import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { tsCoordinate, myElevationResults, myElevationQuery, tsElevations } from 'src/app/shared/interfaces';

@Injectable({
  providedIn: 'root'
})
export class GeoService {
  router: any;
  showHeader: boolean;

  constructor(
    private httpService: HttpService
  ) { }

/********************************************************************************************************
 * Service Methods
 ********************************************************************************************************/

  /** 
  *  ELEVATIONS
  */

  /**
   * Get elevation data from elevations api https://elevation-api.io/
   * TODO - the data is publically available see - work out how to query it locally to save paying
   * https://lpdaac.usgs.gov/products/astgtmv003/
   * https://elevation-api.io/acknowledgements
   * Notes on other platforms:
   * - Runalyze host their own STRM files: https://runalyze.com/help/article/elevation?_locale=en. This data is from 
   *   "Shuttle Radar Topography Mission from 2000", which is free on google maps or Geonames.org, but queries are rate limited
   * - Strava generate their own elevation data from user baro data, but suppliments this with data from "public database"
   *   where they dont have their own data : https://support.strava.com/hc/en-us/articles/216919447-Elevation-for-Your-Activity
   * @param coordsArray array of as tsCoordinate objects (ie points in {lng: xx, lat: xx} format)
   * @param interpolate boolean indication of whether interpolation is desired
   * @param returns simple array of elevations, one for each supplied coordinate
   */
  getElevationsFromAPI(coordsArray: Array<tsCoordinate>, interpolate: boolean) {
    
    return new Promise<tsElevations>( (resolve, reject) => {
      
      // this divides the incoming coords array into an array of chunks no longer than MAX_LEN
      // dont use splice as it cocks things up for reasons i dont understand.
      const MAX_LEN = 2000;
      let sliceArray = [];
      let i = 0;
      do {
        const start = i * MAX_LEN
        sliceArray.push(coordsArray.slice(start, start + MAX_LEN));
        i++;
      } while ( i * MAX_LEN < coordsArray.length);

      // request each chunk in turn, waiting for the last one to resolve before moving on
      sliceArray.reduce( (promise, coordsArray) => {
        return promise.then( (allResults) => 
          this.elevationQuery({options: {interpolate}, coordsArray}).then( (thisResult) => 
            [...allResults, thisResult] 
          ));
      }, Promise.resolve([])).then( (result) => {
        resolve({elevationStatus: 'A', elevs: result[0].result.map(e => e.elev)});
      });

    });
    
  }


  elevationQuery(query: myElevationQuery) {
    return new Promise<myElevationResults>( (res, rej) => {
      this.httpService.myElevationsQuery(query).subscribe( (elevs) => {
        res(elevs);
      })
    });   
  }


  /** 
  *  UTILITIES
  */

  // returns the centre point (centre of gravity) of the rectange defined by the bounding box
  getPathCoG(bbox) {
    return{ lng: ( bbox[0] + bbox[2] ) / 2,
            lat: ( bbox[1] + bbox[3] ) / 2 }; 
  }


  // Creates a flat array of lntlats from supplied GeoJSON
  getDataFromGeoJSON(path: GeoJSON.FeatureCollection) {
    
    let outArray = [];
    path.features.forEach( feature => {
      feature.geometry['coordinates'].forEach( coord => {
        outArray.push(coord);
      })
    })
    return outArray;
  }


  /**
   * function p2p
   * returns distance in meters between two GPS points
   *
   * Implements the Haversine formula
   * https://en.wikipedia.org/wiki/Haversine_formula
   * Vincenty's formula is more accurate but more expensive
   * https://en.wikipedia.org/wiki/Vincenty's_formulae
   *
   * lngLat1 is lng/lat of point 1 in decimal degrees
   * lngLat2 is lng/lat of point 1 in decimal degrees
   *
   * https://www.movable-type.co.uk/scripts/latlong.html
   * can be sped up: https://stackoverflow.com/questions/27928
   *
   */
  p2p(p1: tsCoordinate, p2: tsCoordinate) {

    const R = 6378.137;     // radius of earth
  
    const lat1 = this.degs2rads(p1.lat);
    const lat2 = this.degs2rads(p2.lat);
    const lng1 = this.degs2rads(p1.lng);
    const lng2 = this.degs2rads(p2.lng);
  
    const dlat = lat1 - lat2;
    const dlng = lng1 - lng2;
  
    const a = (Math.sin(dlat/2.0) ** 2.0 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlng/2.0) ** 2.0) ** 0.5;
    const c = 2.0 * Math.asin(a);
  
    return R * c * 1000.0;  // distance in metres
  
  }
  
  /**
  * Simple utility function to convert degrees to radians 
  * @param degs degrees
  * @return radians
  */
  degs2rads(degs: number) {
    return degs * Math.PI / 180.0;
  };
  

  /** 
   * Calculate distance in meters of supplied path chunk
   */
  calculatePathDistance(coords: Array<tsCoordinate>) {
    let distance = 0;
    for (let i = 1; i < coords.length; i++) {
      distance += this.p2p(coords[i-1], coords[i])
    }
    return distance;
  }

  
  /**
   * Calculate elevation based statistics for supplied array of elevations
   * @param elevs simple array of elevations
   * @param distance distance to calculate lumpiness statistic
   */
  calculateElevationStats(elevations: tsElevations, distance?: number) {

    let ascent: number = 0;
    let descent: number = 0;
    let dElev: number;
    let minElev = 9999;
    let maxElev = -9999;
    let badElevData: boolean = false;
    let elevs = elevations.elevs;

    for (let i = 0; i < elevs.length; i++) {
      if (elevs[i] !== -9999 && elevs[i-1] !== -9999) {
        dElev = elevs[i] - elevs[i-1];
        ascent = dElev > 0 ? ascent + dElev : ascent;
        descent = dElev < 0 ? descent + dElev : descent;
        maxElev = elevs[i] > maxElev ? elevs[i] : maxElev;
        minElev = elevs[i] < minElev ? elevs[i] : minElev;
      } else {
        badElevData = true;
        console.log('Bad elevation data');
      }
    }

    return {
        elevationStatus: elevations.elevationStatus,
        ascent: ascent,
        descent: descent,
        lumpiness: distance ? (ascent - descent) / distance : -9999,
        maxElev: maxElev,
        minElev: minElev,
        badElevData: badElevData
        }
      }


}

