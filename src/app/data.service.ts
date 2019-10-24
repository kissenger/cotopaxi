import { EventEmitter, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor() { }

  // from map service to info panel
  pathStats = new EventEmitter();
  menuClick = new EventEmitter();

}

