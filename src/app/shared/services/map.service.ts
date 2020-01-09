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
   * @param lineColor colour of the line as RGB string '#RRGGBB' or auto to pick up colors in the geojson
   */
  plotGeoJson(pathAsGeoJson: GeoJSON.FeatureCollection, styleOptions? ) {
    // console.log(pathAsGeoJson);
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
    let bbox: [mapboxgl.LngLatLike, mapboxgl.LngLatLike] = [[pathAsGeoJson.bbox[0], pathAsGeoJson.bbox[1]], [pathAsGeoJson.bbox[2], pathAsGeoJson.bbox[3]]];
    let options = {
      padding: {top: 10, bottom: 10, left: 10, right: 10},
      linear: false
    }
    this.tsMap.fitBounds(bbox, options);

    // get path stats from GeoJSON
    this.getElevationsIfNeeded(pathAsGeoJson).then( geoJSON => {
      this.dataService.pathStats.emit( pathAsGeoJson['properties'].stats );
    });

  }


  getElevationsIfNeeded(fc: GeoJSON.FeatureCollection) {
    console.log('a');
    return new Promise<GeoJSON.FeatureCollection>( (resolve, reject) => {
      console.log('b');
      if (fc['properties'].params.elev.length === 0 ) {
        // if elevations do not exist
        console.log('no elevatioms');
        resolve(fc);
      } else {
        // if elevations do exist
        console.log('elevations');
        resolve(fc);
      }
    });
  }
}


