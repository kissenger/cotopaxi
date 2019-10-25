import { Injectable } from '@angular/core';
import { HttpService } from 'src/app/http.service'
import { DataService } from './data.service';
import { GeoService } from './geo.service';
import * as mapboxgl from 'mapbox-gl';
import * as globalVars from './globals';
import { getInterpolationArgsLength } from '@angular/compiler/src/render3/view/util';

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
  initialiseMap(location: mapboxgl.LngLatLike) {
    return new Promise<Array<GeoJSON.Position>>( (resolve, reject) => {
      this.tsMap = new mapboxgl.Map({
        container: 'map', 
        style: 'mapbox://styles/mapbox/cjaudgl840gn32rnrepcb9b9g',
        center: location, 
        zoom: 13 
      });
      resolve();
    });

  }

}


/************************************************************
 * NewRoute class
 ************************************************************/
@Injectable()
export class NewRouteService extends MapService{

  private pathAsArray: Array<Array<GeoJSON.Position>> = [];  // path as array of array of points - easier to manipulate and do
  private pathAsGJ: GeoJSON.FeatureCollection = this.getEmptyGeoJSONWrapper();   // path as geojson - to plot on map
  private elevations: Array<Array<number>> = [];
  private markers = [];
  public options = {
    snapProfile: 'driving'
  };

  constructor(
    httpService: HttpService,
    geoService: GeoService,
    dataService: DataService
  ) { 
    super(httpService, geoService, dataService);
  }



  /**
   * Handles the task of creating a geoJson and setting it onto the map
   * note update in two steps per last comment in this thread https://github.com/DefinitelyTyped/DefinitelyTyped/issues/14877
   */
  private updateMapAndStats() {

    // update the map
    this.pathAsGJ = this.coords2GeoJSON(this.pathAsArray);
    const source = this.tsMap.getSource('geojson') as mapboxgl.GeoJSONSource;
    source.setData(this.pathAsGJ);

    // get path stats and broadcast
    this.updatePathStats();

  }




  /**
   * Allow user to create a route on the shown tsMap. Once invoked it will remain active 
   * until the page is refreshed or navigated
    */
  createRoute() {
    
    this.tsMap.on('load', () => {

      this.setUpMap();
      
      this.tsMap.on('click', (e) => {

        // First loop
        if (this.pathAsArray.length === 0) { 
          let start: GeoJSON.Position = [ e.lngLat.lng, e.lngLat.lat ];
          this.pathAsArray.push([start]); 
          this.markers.push(this.addMarker([ e.lngLat.lng, e.lngLat.lat ]));

        // Subsequent loops
        } else {
          let start: GeoJSON.Position = this.pathAsArray.slice(-1)[0].slice(-1)[0];
          let end: GeoJSON.Position = [ e.lngLat.lng, e.lngLat.lat ];
          this.getPath(start, end);
          
        }
      });

    });

      


  }

  /**
   * gets the coordinates and associated elevations for a given start and end point
   * @param s start point
   * @param e end point
   */
  getPath(s: GeoJSON.Position, e: GeoJSON.Position) {
    // get array of coordinates for the next segment
    this.getCoords(s, e).then( (coordsList) => {
      this.pathAsArray.push(coordsList);

      // get array of elevations for returned coordinates
      this.getElevations(coordsList).then( (elevs) => {
        this.elevations.push(elevs);

        // and finally update the map and path stats
        this.updateMapAndStats();
      })

    });  
  }

  /** 
  * Returns an array containing elevations at each provided coordinate
  * TODO: handle errors
  */
  getElevations(coords: Array<GeoJSON.Position>) {

    return new Promise<Array<number>>( (resolveOuter, rej) => {
      let elevations: Array<number> = [];
      let p = Promise.resolve();
      coords.forEach(coord => {
        p = p.then( () => this.getElevation(coord)
            .then( elevation => { elevations.push(elevation); })
            .catch( err => console.log(err))
            );

        });

      // wait for all the p promises to resolve before returning the outer promise
      Promise.all([p]).then( () => { resolveOuter(elevations); });
    })
  }

  /** 
   * Returns the elevation of a single lng,lat point 
   * TODO: handle errors
  */
  getElevation(position: GeoJSON.Position) {

    return new Promise<number>( (resolve, reject) => {

      this.httpService.mapboxElevationsQuery(position).subscribe( (result) => {
        let maxElev = -999;
        result.features.forEach( (feature: GeoJSON.Feature) => {
          maxElev = feature.properties.ele > maxElev ? feature.properties.ele : maxElev;
        })
        resolve(maxElev);
      });

    })
  }

  /**
   * Handles the task of updating the path stats - distance, ascent etc
   * @param pathAsGeoJson geojson containing the current path
   */
  updatePathStats() {

    let distance = this.geoService.pathLength(this.pathAsGJ);
    let pathStats = this.geoService.elevationStats(this.elevations);
    pathStats['distance'] = distance;
    pathStats['lumpiness'] = pathStats.ascent/distance;

    this.dataService.pathStats.emit( pathStats );
  }

  /**
   *  Get a list of coordinates depending on whether snap to roads is on or off
   *  The trivial case of not snapping to road is handled in the same function to simmplify the calling routine,
   *  as this way it only needs to call updatemap() in one place
   * @param start GeoJSON.Position (lng, lat) defining the starting point of this segment
   * @param end   GeoJSON.Position (lng, lat) defining the ending point of this segment
   * @param snap  Boolean defining whether we want to snap to roads or not
   */
  getCoords(start: GeoJSON.Position, end: GeoJSON.Position) {

    return new Promise<Array<GeoJSON.Position>>( (resolve, reject) => {
      let c = [];

      // Do not snap to roads
      if ( this.options.snapProfile === 'none') {
        c.push(start, end);
        resolve(c);

      // Snap to roads: TODO: error handling
      } else {    

        this.httpService.mapboxDirectionsQuery(this.options.snapProfile, start, end).subscribe( (result) => {
          if (result.code === "Ok") { 
            // TODO: Deal with case of start and first coord returned not equal - happens when switching between 
            // snap profiles and leads to discontinuous route
            result.routes[0].geometry.coordinates.forEach( (a: GeoJSON.Position) => { c.push(a) }); 
            resolve(c);
          } else {
            resolve();
          }
        });
      }
      
    });
  }


  /**
   * Converts coords array to geojson for plotting on tsMap
   * TODO: Replace with https://turfjs.org/docs/#explode??
   * @param coords Array of array of coordinate pairs [[[lng1,lat1],[lng2,lat2]],[[lng3,lat3]]]...etc
   * @param return geojson feature collection ready for tsMapbox to display
   */
  coords2GeoJSON(coords: Array<Array<GeoJSON.Position>>) {

    let gj: GeoJSON.FeatureCollection = this.getEmptyGeoJSONWrapper();

    coords.forEach( (c) => {
      gj.features.push( this.getGeoJSONLineString(c) );
    })

    return gj;
    
  }

  /**
  * Removes the last points pushed to the path
  */
  undo() {
    this.pathAsArray.pop();
    this.elevations.pop();
    this.updateMapAndStats();
    if (this.pathAsArray.length === 0) { 
      this.deleteMarker(this.markers[0]); 
      this.markers.splice(0,1);
    }
  }

  public clearPath() {
    this.markers.forEach( (marker) => { this.deleteMarker(marker) })
    this.markers = [];
    this.pathAsArray = [];
    this.elevations = [];
    this.updateMapAndStats(); 
  }

  /**
   * Closes the current path by setting the first coord as the destination
   * Called directly from component, so needs ot be public
   */
  public closePath() {
    let start: GeoJSON.Position = this.pathAsArray.slice(-1)[0].slice(-1)[0];
    let end: GeoJSON.Position = this.pathAsArray[0][0];
    this.getPath(start, end);
  }

  deleteMarker(marker) {
    marker.remove();
  }

  addMarker(pos: mapboxgl.LngLatLike) {
    return new mapboxgl.Marker().setLngLat(pos).addTo(this.tsMap);
  }

  setUpMap() {

    this.tsMap.getCanvas().style.cursor = 'crosshair';

      this.tsMap.addSource('geojson', {
        "type": "geojson",
        "data": this.pathAsGJ
      });
    
      this.tsMap.addLayer({
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
  }

  /**
   * Utility GeoJson Functions to simplify tsMap operations
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
