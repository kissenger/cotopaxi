import { Injectable } from '@angular/core';
import { HttpService } from 'src/app/shared/services/http.service'
import { DataService } from './data.service';
import { GeoService } from './geo.service';
import * as mapboxgl from 'mapbox-gl';
import * as globalVars from 'src/app/shared/globals';
import { tsCoordinate, tsPlotPathOptions, tsMapboxLineStyle } from 'src/app/shared/interfaces';

@Injectable({
  providedIn: 'root'
})
export class MapService{

  private accessToken: string = globalVars.mapboxAccessToken;
  public tsMap: mapboxgl.Map;
  private activeLayers = [];

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

      this.tsMap.on('moveend', (ev) => {
        this.dataService.mapBoundsEmitter.emit(this.getMapBounds());
      });
      
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

  getMapBounds() {
    const mapBounds = this.tsMap.getBounds();
    return [mapBounds.getSouthWest().lng, mapBounds.getSouthWest().lat, mapBounds.getNorthEast().lng, mapBounds.getNorthEast().lat]
  }

  /**
   * plots a geojson path on the map and centers the view on it
   * @param path path as geojson to view on map
   * @param lineWidth width of the line
   * @param lineColor colour of the line as RGB string '#RRGGBB' or auto to pick up colors in the geojson
   */
  addLayerToMap(pathAsGeoJSON, styleOptions: tsMapboxLineStyle, plotOptions: tsPlotPathOptions ) {

    const pathId = pathAsGeoJSON.properties.pathId;

    // remove existing layer if it exists
    // try/catch avoid error if we expect a route to be plotted but it isnt (eg deleted path, user reloads page)
    // TODO this is a horrible mx of assuming there is only one layer shown, and not --> needs cleaning up

    if (plotOptions.booReplaceExisting) {
      if (this.activeLayers.length > 0) {
        try {
          this.tsMap.removeLayer(this.activeLayers[0]);
          this.tsMap.removeSource(this.activeLayers[0]);
          this.activeLayers.pop();
        }
        catch(error) {
          console.log('could not delete pathID ' + this.activeLayers[0]);
          this.activeLayers.pop();
        }
      };
    }

    // add the layer to the map
    this.tsMap.addLayer({
      "id": pathId,
      "type": "line",
      "source": {
        "type": "geojson",
        "data": pathAsGeoJSON
      },
      "paint": {
        'line-width': styleOptions.lineWidth,
        'line-color': styleOptions.lineColor === 'auto' ? ['get', 'color'] : styleOptions.lineColor,
        'line-opacity': styleOptions.lineOpacity
      }
    });
    this.activeLayers.push(pathId);
    
    // set the bounds
    if (plotOptions.booResizeView){
      let bbox: [mapboxgl.LngLatLike, mapboxgl.LngLatLike] = [[pathAsGeoJSON.bbox[0], pathAsGeoJSON.bbox[1]], [pathAsGeoJSON.bbox[2], pathAsGeoJSON.bbox[3]]];
      let options = {
        padding: {top: 10, bottom: 10, left: 10, right: 10},
        linear: true
      }
      this.tsMap.fitBounds(bbox, options);
    }

    // emit the pathStats to the details component (true parameter emits)
    // this.dataService.emitAndStoreActivePath(pathAsGeoJSON);
    if (plotOptions.booSaveToStore) {
      this.dataService.saveToStore('activePath', {source: 'map', pathAsGeoJSON});
      this.dataService.activePathEmitter.emit(pathAsGeoJSON);
      console.log(pathAsGeoJSON);
    }
    // share the map centre so we can use later if we want to create a new map on this position
    // IMPORTANT to wait until the map has stopped moving or this doesnt work
    this.tsMap.on('moveend', (ev) => {
      this.dataService.saveToStore('mapView', this.getMapView());
    });



  }

  removeLayer(pathId: string) {
    if (this.tsMap.getLayer(pathId)) {
      this.tsMap.removeLayer(pathId);
      this.tsMap.removeSource(pathId);
    };
  }


}


