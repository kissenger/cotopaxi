import { Injectable } from '@angular/core';
import { MapService } from './map.service';
import { HttpService } from './http.service';
import { GeoService } from './geo.service';
import { DataService } from './data.service';
import * as mapboxgl from 'mapbox-gl';
import { tsCoordinate } from 'src/app/shared/interfaces';
import { Path, MultiPath } from 'src/app/shared/classes/path-classes';

@Injectable({
  providedIn: 'root'
})

/**
 * A child of the MapService, MapCreateService provides the functions to create a new route on the map
 */
export class MapCreateService extends MapService {

  private multiPath: MultiPath; // used for undo
  private markers: Array<mapboxgl.Marker> = [];
  private options = {
    snapProfile: 'driving'
  };

  constructor(
    httpService: HttpService,
    geoService: GeoService,
    dataService: DataService
  ) { 
    super(httpService, geoService, dataService);
    this.multiPath = new MultiPath();
  }

  
  public getOptions() {
    return this.options;
  }

  /**
   * Handles the task of creating a geoJson and setting it onto the map
   * note update in two steps per last comment in this thread https://github.com/DefinitelyTyped/DefinitelyTyped/issues/14877
   */
  private updateMap() {
    const source = this.tsMap.getSource('geojson') as mapboxgl.GeoJSONSource;
    source.setData(this.multiPath.getGeoJSON());
  }

  /**
   * Allow user to create a route on the shown tsMap. Once invoked it will remain active 
   * until the page is refreshed or navigated
    */
  createRoute() {

    this.setUpMap();
    this.tsMap.on('click', (e) => {

      const clickedPoint: tsCoordinate = { lat: e.lngLat.lat, lng: e.lngLat.lng }; 
      
      // First loop (if firstPoint parameter on multiPath instance has not been set)
      if (!this.multiPath.getFirstPoint()) { 
        this.multiPath.setFirstPoint(clickedPoint);
        this.addMarker(clickedPoint);

      // Subsequent loops
      } else {
        const startPoint: tsCoordinate = this.multiPath.getLastPoint();

        // get coordinates for the next chunk of path and update the map
        this.getNextPathCoords(startPoint, clickedPoint).then( coords => {
          this.multiPath.addPath(new Path(coords));
          this.dataService.pathStatsEmitter.emit( {stats: this.multiPath.getStats(), info: {}} );
          this.updateMap();
          this.addMarker(this.multiPath.getLastPoint());

          // get and update elevations
          this.geoService.getElevationsFromAPI(coords, true).then( (elevations: Array<number>) => {
            this.multiPath.addElevationsToPath(elevations, this.multiPath.nPaths()-1);
            this.dataService.pathStatsEmitter.emit( {stats: this.multiPath.getStats(), info: {}} );
            this.dataService.createdPathData = this.multiPath.getFlatCoordsAndElevs();
          })
        })
      }
    })
  }



  
  /**
   * gets the coordinates for a given start and end point
   * @param start start point
   * @param end end point
   */
  getNextPathCoords(start: tsCoordinate, end: tsCoordinate) {

    return new Promise<Array<tsCoordinate>>( (resolve, reject) => {

      // if we dont need to get directions, just return the supplied coords as an array
      if (this.options.snapProfile === 'none') {
        resolve([start, end]);

      // otherwise, get coords from directions service
      } else {
        this.httpService.mapboxDirectionsQuery(this.options.snapProfile, start, end).subscribe( (result) => {
    
          if (result.code === "Ok") { 
            const returnArray = [];
            result.routes[0].geometry.coordinates.forEach( (coord: GeoJSON.Position) => [
              returnArray.push({lat: coord[1], lng: coord[0]}) ])
            resolve(returnArray);
  
          } else {
            console.log('Mapbox directions query failed with error: ' + result.code)
            resolve();
          }
        });  
      }
    })
  
  }



  /**
   *  Get a list of coordinates depending on whether snap to roads is on or off
   *  The trivial case of not snapping to road is handled in the same function to simmplify the calling routine,
   *  as this way it only needs to call updatemap() in one place
   * @param s tsCoordinate of the starting point of this segment
   * @param e tsCoordinate of the ending point of this segment
   * @returns tsCoordinate array with the path of points
   * Note:
   *  Uses turf to simply the route in order to minimise data points for elevation query
   */
  getPathDirections(s: tsCoordinate, e: tsCoordinate) {

    return new Promise<Array<tsCoordinate>>( (resolve, reject) => {


    })
      
  }


  /**
  * Removes the last points pushed to the path
  */
  undo() {

    // if there are no paths on the array 
    if (this.multiPath.nPaths() === 0) { 
      
      // if there are markers, then delete them and reset multiPath, otherwise do nothing
      if (this.markers.length > 0) {
        this.popMarker();
        this.multiPath.setFirstPoint(null);
        this.multiPath.resetPathStats();
      }
    
      // there are paths on the array so remove the most recent one
    } else {
      this.multiPath.remPath();
      this.updateMap();
      this.popMarker();
      this.dataService.pathStatsEmitter.emit( this.multiPath.getStats() );
    }
  }

  public clearPath() {
    this.clearAllMarkers();
    this.multiPath = new MultiPath();
    this.updateMap(); 
    this.dataService.pathStatsEmitter.emit( this.multiPath.getStats() );
    

  }


  /**
   * Closes the current path by setting the first coord as the destination
   * Called directly from component, so needs ot be public
   */
  public closePath() {
    let startPoint: tsCoordinate = this.multiPath.getLastPoint();
    let endPoint: tsCoordinate = this.multiPath.getFirstPoint();

    // get coordinates for the next chunk of path and update the map
    this.getNextPathCoords(startPoint, endPoint).then( coords => {
      this.multiPath.addPath(new Path(coords));
      this.dataService.pathStatsEmitter.emit( {stats: this.multiPath.getStats(), info: {}} );
      this.updateMap();
      this.addMarker(this.multiPath.getLastPoint());

      // get and update elevations
      this.geoService.getElevationsFromAPI(coords, true).then( (elevations: Array<number>) => {
        this.multiPath.addElevationsToPath(elevations, this.multiPath.nPaths()-1);
        this.multiPath.getStats();
        this.dataService.pathStatsEmitter.emit( {stats: this.multiPath.getStats(), info: {}} );
        this.dataService.createdPathData = this.multiPath.getFlatCoordsAndElevs();
      });
    })
  }

  popMarker() {
    console.log(this.markers);
    let thisMarker: mapboxgl.Marker = this.markers.pop();
    console.log(thisMarker, this.markers);
    thisMarker.remove();
  }

  clearAllMarkers() {
    this.markers.forEach(marker => marker.remove());
    this.markers = [];
  }

  addMarker(pos: tsCoordinate) {
    const newMarker = new mapboxgl.Marker().setLngLat(pos).addTo(this.tsMap);
    this.markers.push(newMarker);
    return newMarker;
  }

  setUpMap() {

    this.tsMap.getCanvas().style.cursor = 'crosshair';

      this.tsMap.addSource('geojson', {
        "type": "geojson",
        "data": {
              "type": "FeatureCollection",
              "features": []
            }
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

}
