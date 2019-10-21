import { Injectable } from '@angular/core';
import * as turf from '@turf/turf'

@Injectable({
  providedIn: 'root'
})
export class GeoService {

  constructor() { }

  pathLength(path) {
    return turf.length(path, {units: 'miles'});
  }


  // /**
  //  * returns statistics for provided path
  //  * @param path array of google.maps.LatLng instances defining the full path
  //  * @param elevs array of array of elevations at each point
  //  * @returns object containing path statistics
  //  */

  // pathStats(path: Array<GeoJSON.Position>, elevs: Array<Array<number>>) {

  //   const d = google.maps.geometry.spherical.computeLength(path);
  //   const dist = path.length === 0 ? 0 : d;
  //   const nPoints = path.length;

  //   let lastElev: number;
  //   let ascent = 0;
  //   let descent = 0;
  //   let dElev: number;

  //   if (elevs) {

  //     for (let i = 0; i < elevs.length; i++) {
  //       for (let j = 0; j < elevs[i].length; j++) {
  //         const thisElev = elevs[i][j];

  //         if (i === 0 && j === 0) {
  //         } else {
  //           dElev = thisElev - lastElev;
  //         }
  //         ascent = dElev > 0 ? ascent + dElev : ascent;
  //         descent = dElev < 0 ? descent + dElev : descent;
  //         lastElev = thisElev;
  //       }
  //     }

  //   }

  //   return {
  //     distance: dist,
  //     ascent: ascent,
  //     descent: descent,
  //     nPoints: nPoints
  //   };

  // }


}
