import { EventEmitter, Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(
    private router: Router
  ) { 


  }

  // from map service to info panel
  pathStats = new EventEmitter();
  menuClick = new EventEmitter();

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

