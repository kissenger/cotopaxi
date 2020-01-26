import { Injectable } from '@angular/core';
import { MapService } from './map.service';
import { HttpService } from './http.service';
import { GeoService } from './geo.service';
import { DataService } from './data.service';
import * as mapboxgl from 'mapbox-gl';
import { tsCoordinate } from 'src/app/shared/interfaces';
// import { Path, MultiPath } from 'src/app/shared/classes/path-classes';

@Injectable({
  providedIn: 'root'
})

/**
 * A child of the MapService, MapCreateService provides the functions to create a new route on the map
 */
export class MapCreateService extends MapService {

  // private multiPath: MultiPath; // used for undo
  private markers: Array<mapboxgl.Marker> = [];
  private options = {
    snapProfile: 'driving'
  };
  private coordsArray: Array<tsCoordinate> = [];
  private geoJSON;

  constructor(
    httpService: HttpService,
    geoService: GeoService,
    dataService: DataService
  ) { 
    super(httpService, geoService, dataService);
    // this.multiPath = new MultiPath();
  }

  public getOptions() {
    return this.options;
  }

  /**
   * Handles the task of creating a geoJson and setting it onto the map
   */
  private refreshMapAfterPathChange() {

    // update the map source ( two steps per this thread https://github.com/DefinitelyTyped/DefinitelyTyped/issues/14877 )
    const source = this.tsMap.getSource('geojson') as mapboxgl.GeoJSONSource;
    source.setData(this.geoJSON);

    // emit so that the details tabs can update, save so that onSave has access to the final route
    console.log(this.geoJSON);

    this.dataService.saveToStore('activePath', {source: 'created', pathAsGeoJSON: this.geoJSON});
    this.dataService.activePathEmitter.emit(this.geoJSON);

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
      if (this.coordsArray.length === 0) {
        this.coordsArray.push(clickedPoint);
        this.addMarker(clickedPoint);

      // Subsequent loops
      } else {
        // const startPoint: tsCoordinate = this.multiPath.getLastPoint();
        const startPoint = this.coordsArray[this.coordsArray.length-1];

        // get coordinates for the next chunk of path, add to the path object
        this.getNextPathCoords(startPoint, clickedPoint).then( (coords: Array<tsCoordinate>) => {
          this.coordsArray = this.coordsArray.concat(coords);
          const elevs = this.geoJSON ? this.geoJSON.features[0].properties.params.elev : [];
          this.httpService.processPoints(this.coordsArray, elevs).subscribe( (result) => {
            this.geoJSON = result.geoJson;
            this.refreshMapAfterPathChange();
            if( this.markers.length>1) { this.popMarker();}
            this.addMarker(this.coordsArray[this.coordsArray.length-1]);
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
  // getPathDirections(s: tsCoordinate, e: tsCoordinate) {

  //   return new Promise<Array<tsCoordinate>>( (resolve, reject) => {

  //   })
      
  // }


  /**
  * Removes the last points pushed to the path
  */
  undo() {

//NEEDS REWRITE

    // if there are no paths on the array 
    // if (this.multiPath.nPaths() === 0) { 
      
    //   // if there are markers, then delete them and reset multiPath, otherwise do nothing
    //   if (this.markers.length > 0) {
    //     this.popMarker();
    //     this.multiPath.setFirstPoint(null);
    //     this.multiPath.resetPathStats();
    //   }
    
    // // there are paths on the array so remove the most recent one
    // } else {
    //   this.multiPath.remPath()
    //   this.refreshMapAfterPathChange();
    //   this.popMarker();
    // }
  }

  public clearPath() {
    this.clearAllMarkers();
    this.coordsArray = [];
    this.geoJSON = this.resetGeoJSON();
    this.refreshMapAfterPathChange(); 
  }


  /**
   * Closes the current path by setting the first coord as the destination
   * Called directly from component, so needs ot be public
   */
  public closePath() {
    let startPoint: tsCoordinate = this.coordsArray[this.coordsArray.length-1];
    let endPoint: tsCoordinate = this.coordsArray[0];

    // get coordinates for the next chunk of path, add to the path object
    this.getNextPathCoords(startPoint, endPoint).then( (coords: Array<tsCoordinate>) => {
      this.coordsArray = this.coordsArray.concat(coords);
      const elevs = this.geoJSON ? this.geoJSON.features[0].properties.params.elev : [];
      this.httpService.processPoints(this.coordsArray, elevs).subscribe( (result) => {
        this.geoJSON = result.geoJson;
        this.refreshMapAfterPathChange();
        if( this.markers.length>1) { this.popMarker();}
        this.addMarker(this.coordsArray[this.coordsArray.length-1]);
      })
    })
  }

  popMarker() {
    let thisMarker: mapboxgl.Marker = this.markers.pop();
    thisMarker.remove();
  }

  clearAllMarkers() {
    this.markers.forEach(marker => marker.remove());
    this.markers = [];
  }

  addMarker(pos: tsCoordinate) {
    const newMarker = new mapboxgl.Marker()
      .setLngLat(pos)
      .addTo(this.tsMap);
    this.markers.push(newMarker);
    return newMarker;
  }

  kill() {
    this.coordsArray =[];
    this.geoJSON = null;
    this.clearAllMarkers();
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

  resetGeoJSON() {

    return {
    "type": "FeatureCollection",
    "features": [{      
      "type": "Feature",
      "geometry": {
          "type": "LineString",
          "coordinates": []
      },
      "properties": {
          "params": {
              "elev": [],
              "cumDistance": []
          },
          "stats": {
            "distance": 0,
            "nPoints": 0,
            "elevations": {
              "ascent": 0,
              "descent": 0,
              "lumpiness": 0,
              "maxElev": 0,
              "minElev": 0
            },
          },
          "info": {
              "name": "",
              "description": "",
              "isLong": false
          
          }
        }
      }]
    }}
}
