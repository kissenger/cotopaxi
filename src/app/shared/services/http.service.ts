import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as globalVars from 'src/app/shared/globals';
import { tsCoordinate } from 'src/app/shared/interfaces';
import { openElevationQueryObject } from '../interfaces';

@Injectable()
export class HttpService {

  private DEBUG = true;
  private accessToken = globalVars.mapboxAccessToken;
  // private hostName = '192.168.0.12'
  private hostName = 'localhost';

  constructor( private http: HttpClient ) {}

  /********************************************************************************************
  *  Mapping queries
  ********************************************************************************************/
  mapboxDirectionsQuery(profile: String, start: tsCoordinate, end: tsCoordinate) {
    const coords:String =  start.lng.toFixed(6) + ',' + start.lat.toFixed(6) + ';' + end.lng.toFixed(6) + ',' + end.lat.toFixed(6);
    return this.http.get<any>('https://api.mapbox.com/directions/v5/mapbox/' + profile + '/' + coords + '?geometries=geojson&access_token=' + this.accessToken);
  }

  // not used
  // mapboxElevationsQuery(position: tsCoordinate) {
  //   return this.http.get<any>('https://api.mapbox.com/v4/mapbox.mapbox-terrain-v2/tilequery/' + position.lng + ',' + position.lat + '.json?layers=contour&limit=50&access_token=' + this.accessToken);
  // }
 
  // not used
  // mapboxTerrainRGBQuery(xyz: Array<number>) {
  //   const coords: String = xyz[2] + '/' + xyz[0] + '/' + xyz[1];
  //   return this.http.get('https://api.mapbox.com/v4/mapbox.terrain-rgb/'+ coords + '.pngraw?access_token=' + this.accessToken, { responseType: 'blob' } );
  // }

  elevationAPIQuery(queryString: openElevationQueryObject) {
    return this.http.post<any>('https://elevation-api.io/api/elevation?resolution=30&key=5nbL4Q8T7bu-a6IbeN1-QLB6zaSqFQ', queryString)
  }

  /********************************************************************************************
   *  calls to the backend
   ********************************************************************************************/
  importRoute(formData: Object) {
    return this.http.post<any>('http://' + this.hostName + ':3000/import-route/', formData);
  }

  saveCreatedRoute(type: String, pathData: Object) {
    return this.http.post<any>('http://' + this.hostName + ':3000/save-path/' + type, pathData);
  }

}
