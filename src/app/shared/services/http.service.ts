import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as globalVars from 'src/app/shared/globals';
import { tsCoordinate } from 'src/app/shared/interfaces';
import { myElevationQuery } from '../interfaces';

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

  myElevationsQuery(queryString: myElevationQuery) {
    console.log('http://' + this.hostName + ':3001/elevations/', queryString);
    return this.http.post<any>('http://' + this.hostName + ':3001/elevations/', queryString);
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
