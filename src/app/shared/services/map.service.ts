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
  initialiseMap(location?: tsCoordinate) {
    return new Promise<Array<tsCoordinate>>( (resolve, reject) => {
      this.tsMap = new mapboxgl.Map({
        container: 'map', 
        style: 'mapbox://styles/mapbox/cjaudgl840gn32rnrepcb9b9g',
        zoom: 13 
      });
      if (location) { this.tsMap.setCenter(location); }
      this.tsMap.on('load', () => {
        resolve();
      })
      
    });

  }

  getCentre() {
    const location = this.tsMap.getCenter();
    return <tsCoordinate>{lng: location[0], lat: location[1]}
  }

  /**
   * plots a geojson path on the map and centers the view on it
   * @param path path as geojson to view on map
   * @param lineWidth width of the line
   * @param lineColor colour of the line as RGB string '#RRGGBB' or auto to pick up colors in the geojson
   */
  plotSingleGeoJson(pathAsGeoJson: GeoJSON.FeatureCollection, styleOptions? ) {
    // console.log(pathAsGeoJson);
    if (!styleOptions) {
      styleOptions = {
        lineWidth: 3,
        lineColour: 'auto',
        lineOpacity: 1
      }
    }

    // remove existing layer if it exists
    // if (this.tsMap.getLayer('route')) {this.tsMap.removeLayer('route')};
    if (this.tsMap.getLayer('route')) {
      this.tsMap.removeLayer('route');
      this.tsMap.removeSource('route');
    };

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
    let bbox: [mapboxgl.LngLatLike, mapboxgl.LngLatLike] = [[pathAsGeoJson.bbox[0], pathAsGeoJson.bbox[1]], [pathAsGeoJson.bbox[2], pathAsGeoJson.bbox[3]]];
    let options = {
      padding: {top: 10, bottom: 10, left: 10, right: 10},
      linear: false
    }
    this.tsMap.fitBounds(bbox, options);

    // emit the pathStats to the details component 
    this.dataService.emitAndStoreActivePath(pathAsGeoJson);

  }
}


