import { EventEmitter, Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  public pageType = this.router.url.split('/')[2];

  constructor(
    private router: Router
  ) { }

  // from map service to info panel
  pathStats = new EventEmitter();
  menuClick = new EventEmitter();

  
  
}

// this.timer = setInterval( () => {
//   if (this.router.url !== '/') { 
//     this.page = this.router.url.split('/')[2];
//     if (this.page === 'list') { this.isListPage = true; }
//     if (this.page === 'create') { this.isCreatePage = true; }
//     clearInterval(this.timer); 
//   } 
// }, 1);