import { Injectable } from '@angular/core';
import { HttpService } from 'src/app/http.service'
import { DataService } from './data.service';
import { GeoService } from './geo.service';
import * as mapboxgl from 'mapbox-gl';
import * as globalVars from '../globals';

@Injectable({
  providedIn: 'root'
})
export class MapService {

  private accessToken = globalVars.mapboxAccessToken;

  private createdRouteCoords: Array<Array<GeoJSON.Position>> = [];
  private snapToRoads = true;

  constructor(
    public httpService: HttpService,
    public geoService: GeoService,
    public dataService: DataService
  ) { 
    
    Object.getOwnPropertyDescriptor(mapboxgl, 'accessToken').set(this.accessToken);

  }

 
  /**
   * Shows the mapbox map
   * @param location location on which to centre the map
   */
  showMap(location: mapboxgl.LngLatLike) {

    
    return new mapboxgl.Map({
      container: 'map', 
      style: 'mapbox://styles/mapbox/streets-v11',
      center: location, 
      zoom: 13 
    });
  }

  /**
   * Allow user to create a route on the shown map. Once invoked it will remain active 
   * until the page is refreshed or navigated
   * @param m map
    */
  createRoute(m: mapboxgl.Map) {
    
    let geojson: GeoJSON.FeatureCollection = this.getEmptyGeoJSONWrapper();
   
    m.on('load', () => {

      m.addSource('geojson', {
        "type": "geojson",
        "data": geojson
      });
    
      m.addLayer({
        id: 'measure-lines',
        type: 'line',
        source: 'geojson',
        layout: {
          'line-cap': 'round',
          'line-join': 'round'
        },
        paint: {
          'line-color': '#000',
          'line-width': 2.5
        },
        filter: ['in', '$type', 'LineString']
      });

      m.on('click', (e) => {

        let end: GeoJSON.Position = [ e.lngLat.lng, e.lngLat.lat ];
        if (this.createdRouteCoords.length === 0) {
          // first loop through, just catch the point and move on
          this.createdRouteCoords.push([end]);

        } else {
          // all other loops, get the start point as the last point of the existing array
          let start: GeoJSON.Position = this.createdRouteCoords.slice(-1)[0].slice(-1)[0];
          
          this.getCoords(start, end, this.snapToRoads).then( (coords) => {
            this.createdRouteCoords.push(coords);
            geojson = this.coords2GeoJSON(this.createdRouteCoords);
            // two steps per last comment in this thread https://github.com/DefinitelyTyped/DefinitelyTyped/issues/14877
            const source = m.getSource('geojson') as mapboxgl.GeoJSONSource;
            source.setData(geojson);
            // get path stats and broadcast
            this.dataService.pathStats.emit(
              { 
                distance: this.geoService.pathLength(geojson)
              }
            );
          });  
        }
      });

    });

    m.on('mousemove', function (e) {
      let features = m.queryRenderedFeatures(e.point, { layers: [] });
      // UI indicator for clicking/hovering a point on the map
      m.getCanvas().style.cursor = (features.length) ? 'pointer' : 'crosshair';
    });

  }


  /**
   *  Get a list of coordinates depending on whether snap to roads is on or off
   *  The trivial case of not snapping to road is handled in the same function to simmplify the calling routine,
   *  as this way it only needs to call updatMap() in one place
   * @param start GeoJSON.Position (lng, lat) defining the starting point of this segment
   * @param end   GeoJSON.Position (lng, lat) defining the ending point of this segment
   * @param snap  Boolean defining whether we want to snap to roads or not
   */
  getCoords(start: GeoJSON.Position, end: GeoJSON.Position, snap: Boolean) {

    return new Promise<Array<GeoJSON.Position>>( (resolve, reject) => {
      let c = [];

      if (!snap) {
        // dont snap to roads, just push the start and end points and resolve the promise
        c.push(start, end);
        resolve(c);

      } else {
        // do snap to roads so make the query and return when we have a response form the front end
        let profile = 'walking';
        this.httpService.mapboxDirectionsQuery(profile, start, end).subscribe( (result) => {
          if (result.code === "Ok") { 
            result.routes[0].geometry.coordinates.forEach( (a: GeoJSON.Position) => {c.push(a)}); 
            resolve(c);
          } else {
            // TODO: handle this error
            resolve();
          }
        });
      }
      
    });
  }


  /**
   * Converts coords array to geojson for plotting on map
   * @param coords Array of array of coordinate pairs [[[lng1,lat1],[lng2,lat2]],[[lng3,lat3]]]...etc
   * @param return geojson feature collection ready for mapbox to display
   */
  coords2GeoJSON(coords: Array<Array<GeoJSON.Position>>) {

    let gj: GeoJSON.FeatureCollection = this.getEmptyGeoJSONWrapper();

    coords.forEach( (c) => {
      gj.features.push( this.getGeoJSONLineString(c) );
    })

    return gj;
    
  }


  /**
   * Utility GeoJson Functions to simplify map operations
   */
  getEmptyGeoJSONWrapper() {
    return <GeoJSON.FeatureCollection>{
      "type": "FeatureCollection",
      "features": []
    };
  }

  getGeoJSONPoint(p: GeoJSON.Position) {
    return <GeoJSON.Feature> {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": p
      },
      "properties": {}
    };
  }

  getGeoJSONLineString(c: Array<GeoJSON.Position>) {
    return <GeoJSON.Feature> {
      "type": "Feature",
        "geometry": {
          "type": "LineString",
          "coordinates": c
        },
        "properties": {}
    };
  }



}
