import { EventEmitter, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { tsCoordinate } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  // holder for the active path where it is needed to be refd by different components
  public activePathToView: GeoJSON.FeatureCollection;

  constructor(
    private router: Router
  ) { 
  }

  /**
   * Collection of variables and methods to enable emission, storage and retrieval of the 
   * CREATED OR IMPORTED PATHS BEFORE RECALL FROM DB
   */
  public menuClickEmitter = new EventEmitter();          // from map service to info panel
  public pathStatsEmitter = new EventEmitter();   // from map-create to panel-create-detail 
  // stored by map-create-service, accessed by panel-routes-create-details
  public createdPathData: {coords: Array<tsCoordinate>, elevations: {elevs: Array<Number>, elevationStatus: String}}; 
  // stored by panel-routes-list-options, accessed by panel-routes-create-details
  public importedPathData: {pathId: String, info: {}};

  /**
   * Collection of variables and methods to enable emission, storage and retrieval of the 
   * CURRENTLY ACTIVE PATH RECALLED FROM DATABASE
   */
  public desiredPathEmitter = new EventEmitter();   // emits from panel-routes-list-list and subscribed to in routes-list
  public activePathPropertiesEmitter = new EventEmitter();
  private activePathGeoJSON;
  public emitAndStoreActivePath(pathAsGeoJSON: GeoJSON.FeatureCollection) {
    this.activePathPropertiesEmitter.emit(pathAsGeoJSON['properties']);
    this.activePathGeoJSON = pathAsGeoJSON;
  }
  public getActivePathProps() {
    return this.activePathGeoJSON.properties;
  }
  public getActivePathId() {
    return this.activePathGeoJSON.properties.pathId;
  }


  getPageName() {
    return new Promise<string>( (resolve, rej) => {
      let timer = setInterval( () => {
        if (this.router.url !== '/') { 
          clearInterval(timer); 
          resolve(this.router.url.split('/')[2]);
        } 
      }, 1);
    });
  }
  
  
}

