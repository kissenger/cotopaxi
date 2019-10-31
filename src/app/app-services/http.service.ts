import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as globalVars from './globals';

@Injectable()
export class HttpService {

  private DEBUG = true;
  private accessToken = globalVars.mapboxAccessToken;

  // If using Gordons laptop, this will work, otherwise uncomment the line below
  // private hostName = '192.168.0.12';
  // private hostname = 'localhost';

  constructor( private http: HttpClient ) {}

  mapboxDirectionsQuery(profile: String, start: GeoJSON.Position, end: GeoJSON.Position) {
    const coords:String =  start[0].toFixed(6) + ',' + start[1].toFixed(6) + ';' + end[0].toFixed(6) + ',' + end[1].toFixed(6);
    return this.http.get<any>('https://api.mapbox.com/directions/v5/mapbox/' + profile + '/' + coords + '?geometries=geojson&access_token=' + this.accessToken);
  }

  mapboxElevationsQuery(position: GeoJSON.Position) {
    return this.http.get<any>('https://api.mapbox.com/v4/mapbox.mapbox-terrain-v2/tilequery/' + position[0] + ',' + position[1] + '.json?layers=contour&limit=50&access_token=' + this.accessToken);
  }
}
