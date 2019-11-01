import { Injectable } from '@angular/core';
import * as turf from '@turf/turf'
import { DataService } from './data.service';
import { HttpService } from './http.service';

@Injectable({
  providedIn: 'root'
})
export class GeoService {

  constructor(
    private dataService: DataService,
    private httpService: HttpService
  ) { }

  /** 
  *  ELEVATIONS
  */

  /** 
  * Returns an array containing elevations at each provided coordinate
  * TODO: handle reject
  */
 getMapboxElevations(coords: Array<GeoJSON.Position>) {

  return new Promise<Array<number>>( (resolveOuter, rej) => {
    let elevations: Array<number> = [];
    let p = Promise.resolve();
    coords.forEach(coord => {
      p = p.then( () => this.getMapboxElevation(coord)
          .then( elevation => { elevations.push(elevation); })
          .catch( err => console.log(err))
          );

      });

    // wait for all the p promises to resolve before returning the outer promise
    Promise.all([p]).then( () => { resolveOuter(elevations); });
  })
}

/** 
 * Returns the elevation of a single lng,lat point 
 * Elevation query returns all the geometric features at the point, so you have to loop through
 * them all and find the one with the maximum elevation
 * TODO: handle reject
*/
getMapboxElevation(position: GeoJSON.Position) {

  return new Promise<number>( (resolve, reject) => {

    this.httpService.mapboxElevationsQuery(position).subscribe( (result) => {
      let maxElev = -999;
      result.features.forEach( (feature: GeoJSON.Feature) => {
        maxElev = feature.properties.ele > maxElev ? feature.properties.ele : maxElev;
      })
      resolve(maxElev);
    });

  })
}




  /**
   * Handles the task of updating the path stats - distance, ascent etc
   * Also emits the rsulting object for whatever listening component to pic
   * @param pathAsGeoJson geojson containing the current path
   */
  getAndEmitPathStats(path: GeoJSON.FeatureCollection, elevs: Array<Array<number>>) {

    let distance = this.pathLength(path);
    let pathStats = this.elevationStats(elevs);
    pathStats['distance'] = distance;
    pathStats['lumpiness'] = pathStats.ascent/distance;

    this.dataService.pathStats.emit( pathStats );
  }


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


}



