import { Injectable } from '@angular/core';
import * as turf from '@turf/turf'

@Injectable({
  providedIn: 'root'
})
export class GeoService {

  constructor() { }

  pathLength(path) {
    return turf.length(path, {units: 'kilometers'});
  }


  /**
   * returns statistics for provided path
   * @param path array of google.maps.LatLng instances defining the full path
   * @param elevs array of array of elevations at each point
   * @returns object containing path statistics
   */

  elevationStats(elevs: Array<Array<number>>) {

    let nPoints: number = 0;
    let lastElev: number;
    let ascent: number = 0;
    let descent: number = 0;
    let dElev: number;

    if (elevs) {

      for (let i = 0; i < elevs.length; i++) {
        for (let j = 0; j < elevs[i].length; j++) {
          const thisElev = elevs[i][j];

          if (i === 0 && j === 0) {
          } else {
            dElev = thisElev - lastElev;
          }
          ascent = dElev > 0 ? ascent + dElev : ascent;
          descent = dElev < 0 ? descent + dElev : descent;
          lastElev = thisElev;
          nPoints++;
        }
      }

    }

    return {
      ascent: ascent,
      descent: descent,
      nPoints: nPoints,
    
    };

  }


}
