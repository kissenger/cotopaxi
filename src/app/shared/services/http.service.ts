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
    return this.http.post<any>('http://' + this.hostName + ':3000/ups-and-downs/v1/', queryString);
  }

  /********************************************************************************************
   *  calls to the backend
   ********************************************************************************************/
  importRoute(formData: Object) {
    return this.http.post<any>('http://' + this.hostName + ':3000/import-route/', formData);
  }

  saveCreatedRoute(pathData: Object) {
    return this.http.post<any>('http://' + this.hostName + ':3000/save-new-route/', pathData);
  }

  saveImportedPath(pathData: Object) {
    return this.http.post<any>('http://' + this.hostName + ':3000/save-imported-path/', pathData);
  }

  flushDatabase() {
    return this.http.post<any>('http://' + this.hostName + ':3000/flush/', '');
  }

  getPathsList(type: String, offset: Number) {
    return this.http.get<any>('http://' + this.hostName + ':3000/get-paths-list/' + type + '/' + offset);
  }
}
