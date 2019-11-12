import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { tsCoordinate, openElevationResultObject } from 'src/app/shared/interfaces';
import { connectableObservableDescriptor } from 'rxjs/internal/observable/ConnectableObservable';

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
   * @param coords as geojeon long/lats
   * Note that api required list of lat/lng so need to swap the values around
   * maximum query length is 250 points, but no limit on no requests per second
   * So chunks the data into arrays of 250 points max length and sends each with a promise
   * loop, and returns when the last promise is resolved.
   * TODO - pretty sure this can be neatened up...
   */
  getElevationAPIElevs(coordArray: Array<tsCoordinate>) {
    
    return new Promise<Array<number>>( (resolveOuter, rejectOuter) => {

      // this divides the incoming coords array into an array of chunks no longer than MAX_LEN
      // dont use splice as it cocks things up for reasons i dont understand.
      const MAX_LEN = 250;
      let sliceArray = [];
      let i = 0;
      do {
        const start = i * MAX_LEN
        sliceArray.push(coordArray.slice(start, start + MAX_LEN));
        i++;
      } while ( i * MAX_LEN < coordArray.length);

      // loop through arrays and request elevation data
      let outArray = [];
      let p = Promise.resolve();
      sliceArray.forEach(chunk => {
        p = p.then( () => this.openElevationQuery(chunk.map( (c: tsCoordinate) => [c.lat, c.lng]))
            .then( result => { 
              console.log(result);
              result.elevations.forEach( (position) => { outArray.push(position.elevation); })
            })
            .catch(err => console.log(err))
            );

        });

        
      // wait for all the p promises to resolve before returning the outer promise
      Promise.all([p]).then( () => {
        console.log(outArray);
        resolveOuter(outArray);
      });

    });
    
  }


  openElevationQuery(c: Array<Array<number>>) {
    return new Promise<openElevationResultObject>( (resolve, rej) => {
      this.httpService.elevationAPIQuery({'points': c}).subscribe( elevs => {
        resolve(elevs);
      })
    });   
  }


  /** 
  *  UTILITIES
  */


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
   * Calculate distance in km of supplied path chunk
   */
  calculatePathDistance(coords: Array<tsCoordinate>) {
    let distance = 0;
    for (let i = 1; i < coords.length; i++) {
      distance += this.p2p(coords[i-1], coords[i])
    }
    return distance/1000.0;
  }

  
  /**
   * Calculate elevation based statistics for supplied array of elevations
   * @param elevs simple array of elevations
   * @param distance distance to calculate lumpiness statistic
   */
  calculateElevationStats(elevs: Array<number>, distance?: number) {
    
    let ascent: number = 0;
    let descent: number = 0;
    let dElev: number;
    let minElev = 9999;
    let maxElev = -9999;
    let badElevData: boolean = false;

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
        ascent: ascent,
        descent: descent,
        lumpiness: distance ? (ascent - descent) / distance : -9999,
        maxElevation: maxElev,
        minElevation: minElev,
        badElevData: badElevData
        }
      }


}

