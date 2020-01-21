import { Component, OnInit, OnDestroy } from '@angular/core';
import { MapCreateService } from 'src/app/shared/services/map-create.service'
import { DataService } from 'src/app/shared/services/data.service';
import * as globals from 'src/app/shared/globals';
import { Subscription } from 'rxjs';
import { HttpService } from 'src/app/shared/services/http.service';


@Component({
  selector: 'app-routes-create',
  templateUrl: './routes-create.component.html',
  styleUrls: ['./routes-create.component.css']
})
export class RoutesCreateComponent implements OnInit, OnDestroy {

  private menuSubscription: Subscription;
  private pathIdSubscription: Subscription;
  private overlaidPaths = [];

  constructor(
    private dataService: DataService,
    private mapCreateService: MapCreateService,
    private httpService: HttpService
    ) { }

  ngOnInit() {

    // centre map on the currently loading route if it exists, otherwise take users home location
    let mapView = this.dataService.getFromStore('mapView', true);
    let startPosition = mapView ? mapView.centre : globals.userHomeLocation;
    let startZoom = mapView ? mapView.zoom : 5;

    // initialise the map and launch createroute
    this.mapCreateService.initialiseMap(startPosition, startZoom).then( () => {
      this.mapCreateService.createRoute();
    });
    
    // listen for menu commands
    this.menuSubscription = this.dataService.menuClickEmitter.subscribe( (fromMenu) => {
      if (fromMenu.command) {
        if (fromMenu.command === 'undo') { this.mapCreateService.undo(); }
        if (fromMenu.command === 'close') { this.mapCreateService.closePath(); }
        if (fromMenu.command === 'clear') { this.mapCreateService.clearPath(); }
      } else { 
        let optionKey = Object.keys(fromMenu.option)[0];
        this.mapCreateService.getOptions()[optionKey] = fromMenu.option[optionKey]; 
      }
    })

    // listen for pathID emission from panel-routes-list-list, and get the path from the backend
    this.pathIdSubscription = this.dataService.pathIdEmitter.subscribe( (pathId) => {

      // if pathId is not in overlaidPaths then add it
      if (!this.overlaidPaths.includes(pathId)){
        this.httpService.getPathById('route', pathId).subscribe( (result) => {
          const plotOptions = {booReplaceExisting: false, booResizeView: false, booSaveToStore: false};
          this.mapCreateService.addLayerToMap(result.geoJson, globals.overlayLineStyle, plotOptions);
          this.overlaidPaths.push(pathId);
        })

      // otherwise pathID is present, so remove from map and delete key from object
      } else {
        this.mapCreateService.removeLayer(pathId);
        this.overlaidPaths.splice(this.overlaidPaths.indexOf(pathId),1);
      } 

    })
  }    

  ngOnDestroy() {
    this.menuSubscription.unsubscribe();
    this.pathIdSubscription.unsubscribe();
  }

  
}
