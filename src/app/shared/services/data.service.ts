import { EventEmitter, Injectable } from '@angular/core';
import { Router } from '@angular/router';

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

  // from map service to info panel
  pathStats = new EventEmitter();
  menuClick = new EventEmitter();
  public pathObject;

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

