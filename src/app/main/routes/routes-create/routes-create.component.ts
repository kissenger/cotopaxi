import { Component, OnInit, OnDestroy } from '@angular/core';
import { MapCreateService } from 'src/app/shared/services/map-create.service'
import { DataService } from 'src/app/shared/services/data.service';
import { tsCoordinate } from 'src/app/shared/interfaces';
import * as globalVars from 'src/app/shared/globals';


@Component({
  selector: 'app-routes-create',
  templateUrl: './routes-create.component.html',
  styleUrls: ['./routes-create.component.css']
})
export class RoutesCreateComponent implements OnInit, OnDestroy {

  private menuSubs;

  constructor(
    private dataService: DataService,
    private mapCreateService: MapCreateService
    ) { }

  ngOnInit() {

    // centre map on the currently loading route if it exists, otherwise take users home location
    let mapView = this.dataService.getFromStore('mapView', true);
    let startPosition = mapView ? mapView.centre : globalVars.userHomeLocation;
    let startZoom = mapView ? mapView.zoom : 5;

    // initialise the map and launch createroute
    this.mapCreateService.initialiseMap(startPosition, startZoom).then( () => {
      this.mapCreateService.createRoute();
    });
    
    // listen for menu commands
    this.menuSubs = this.dataService.menuClickEmitter.subscribe( (fromMenu) => {
      if (fromMenu.command) {
        if (fromMenu.command === 'undo') { this.mapCreateService.undo(); }
        if (fromMenu.command === 'close') { this.mapCreateService.closePath(); }
        if (fromMenu.command === 'clear') { this.mapCreateService.clearPath(); }
      } else { 
        let optionKey = Object.keys(fromMenu.option)[0];
        this.mapCreateService.getOptions()[optionKey] = fromMenu.option[optionKey]; 
      }
    })

  }    

  ngOnDestroy() {
    this.menuSubs.unsubscribe();
  }

  
}
