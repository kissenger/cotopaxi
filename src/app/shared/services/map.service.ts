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
    console.log('map init');
    // get and set the mapbox access token to enable the api
    Object.getOwnPropertyDescriptor(mapboxgl, 'accessToken').set(this.accessToken);

  }

  isMap(){
    return !!this.tsMap;
  }

  killMap() {
    this.tsMap = null;
  }

  /**
   * Shows the mapbox map
   * @param location location on which to centre the map
   */
  initialiseMap(location?: tsCoordinate, zoom?: number) {
    
    // setting the center and zoom here prevents flying animation - zoom gets over-ridden when the map bounds are set below 
    return new Promise<Array<tsCoordinate>>( (resolve, reject) => {
      this.tsMap = new mapboxgl.Map({
        container: 'map', 
        style: 'mapbox://styles/mapbox/cjaudgl840gn32rnrepcb9b9g',
        center: location ? location : globalVars.userHomeLocation,
        zoom: zoom ? zoom : 13
      });

      this.tsMap.on('load', () => {
        resolve();
      })
      
    });

  }

  /**
   * Returns the centre and zoom level of the current map view
   */
  getMapView() {
    const centre = this.tsMap.getCenter();
    const zoom = this.tsMap.getZoom();
    return {centre, zoom}
  }

  /**
   * plots a geojson path on the map and centers the view on it
   * @param path path as geojson to view on map
   * @param lineWidth width of the line
   * @param lineColor colour of the line as RGB string '#RRGGBB' or auto to pick up colors in the geojson
   */
  plotSingleGeoJson(pathAsGeoJson: GeoJSON.FeatureCollection, styleOptions? ) {

    if (!styleOptions) {
      styleOptions = {
        lineWidth: 3,
        lineColour: 'auto',
        lineOpacity: 1
      }
    }

    // remove existing layer if it exists
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
      linear: true
    }
    this.tsMap.fitBounds(bbox, options);

    // emit the pathStats to the details component (true parameter emits)
    // this.dataService.emitAndStoreActivePath(pathAsGeoJson);
    this.dataService.saveToStore('activePath', {source: 'map', pathAsGeoJson});
    this.dataService.activePathEmitter.emit(pathAsGeoJson);
    console.log(pathAsGeoJson);

    // share the map centre so we can use later if we want to create a new map on this position
    // IMPORTANT to wait until the map has stopped moving or this doesnt work
    this.tsMap.on('moveend', (ev) => {
      this.dataService.saveToStore('mapView', this.getMapView());
    });

  }




}


