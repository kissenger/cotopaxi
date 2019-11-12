import { Injectable } from '@angular/core';
import { HttpService } from 'src/app/shared/services/http.service'
import { DataService } from './data.service';
import { GeoService } from './geo.service';
import * as mapboxgl from 'mapbox-gl';
import * as globalVars from 'src/app/shared/globals';
import { tsCoordinate } from 'src/app/shared/interfaces';

@Injectable({
  providedIn: 'root'
})
export class MapService{

  private accessToken: string = globalVars.mapboxAccessToken;
  public tsMap: mapboxgl.Map;



  constructor(
    public httpService: HttpService,
    public geoService: GeoService,
    public dataService: DataService
  ) { 

    // get and set the mapbox access token to enable the api
    Object.getOwnPropertyDescriptor(mapboxgl, 'accessToken').set(this.accessToken);

  }

  /**
   * Shows the mapbox map
   * @param location location on which to centre the map
   */
  initialiseMap(location: tsCoordinate) {
    return new Promise<Array<tsCoordinate>>( (resolve, reject) => {
      this.tsMap = new mapboxgl.Map({
        container: 'map', 
        style: 'mapbox://styles/mapbox/cjaudgl840gn32rnrepcb9b9g',
        center: location, 
        zoom: 13 
      });
      this.tsMap.on('load', () => {
        resolve();
      })
      
    });

  }

  /**
   * plots a geojson path on the map and centers the view on it
   * @param path path as geojson to view on map
   * @param lineWidth width of the line
   * @param lineColor colour of the line as RGB string '#000000' or auto to pick up colors in the geojson
   */
  plotGeoJson(pathAsGeoJson: GeoJSON.FeatureCollection, styleOptions? ) {

    if (!styleOptions) {
      styleOptions = {
        lineWidth: 3,
        lineColour: 'auto',
        lineOpacity: 1
      }
    }

    // add the layer to the map
    this.tsMap.addLayer({
      "id": "route",
      "type": "line",
      "source": {
        "type": "geojson",
        "data": pathAsGeoJson
        },
      "paint": {
        'line-width': styleOptions.lineWidth,
        'line-color': styleOptions.lineColor === 'auto' ? ['get', 'color'] : styleOptions.lineColor,
        'line-opacity': styleOptions.lineOpacity
        }
      });

      // set the bounds
    this.tsMap.fitBounds([[pathAsGeoJson.bbox[0], pathAsGeoJson.bbox[1]], [pathAsGeoJson.bbox[2], pathAsGeoJson.bbox[3]]]);

    // now find elevations, and once returned, update path stats and emit to listening components
    let pathAsArray = this.geoService.getDataFromGeoJSON(pathAsGeoJson);
    // this.geoService.getElevationAPIElevs(pathAsArray).then( (coords: Array<tsCoordinate>) => {
    //   this.dataService.pathStats.emit( this.geoService.getPathStats(coords) );
    // });
  }


}


