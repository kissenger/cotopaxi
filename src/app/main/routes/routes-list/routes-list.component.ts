import { Component, OnInit, OnDestroy } from '@angular/core';
import { MapService } from 'src/app/shared/services/map.service';
import { DataService } from 'src/app/shared/services/data.service';
import { HttpService } from 'src/app/shared/services/http.service';
import { Subscription } from 'rxjs';
import * as globals from 'src/app/shared/globals';
import { tsLineStyle, tsPlotPathOptions } from 'src/app/shared/interfaces';
import { GeoService } from 'src/app/shared/services/geo.service';

@Component({
  selector: 'app-routes',
  templateUrl: './routes-list.component.html',
  styleUrls: ['./routes-list.component.css']
})

export class RoutesListComponent implements OnInit, OnDestroy {

  private pathIdSubscription: Subscription;
  private geoJSON;
  private plotOptions: tsPlotPathOptions = {
    booReplaceExisting: true, 
    booResizeView: true, 
    booSaveToStore: true,
    booPlotMarkers: true
  };
  private lineStyle: tsLineStyle = {}; // take lineStyle from geoJSON
  

  constructor(
    private dataService: DataService,
    private mapService: MapService,
    private httpService: HttpService,
    private geoService: GeoService

    ) { } 

  /**
   * Component RoutesListComponent
   * Contains map and info panel
   * Displays route on map 
   * 
   * 
   * 
   */

  ngOnInit() {

    // if we come into list component from eg delet route, the map exists and is causing trouble, so delete it and start afresh
    if (this.mapService.isMap()) { this.mapService.killMap(); }
  
    // listen for pathID emission from panel-routes-list-list, and get the path from the backend
    this.pathIdSubscription = this.dataService.pathIdEmitter.subscribe( (pathId) => {
      this.httpService.getPathById('route', pathId).subscribe( (result) => {

        // put on the class to avoid passing to functions
        this.geoJSON = result.hills;
        console.log(result.hills);
        // as initialisation will temporarily show default location, only run it if map doesnt currently exist
        this.initialiseMapIfNeeded().then( () => {
          this.mapService.addLayerToMap(this.geoJSON, this.lineStyle, this.plotOptions);
        });

      })
    })
  }

  /**
   * checks if map already exists, and if not then create it and wait for it to load
   */
  initialiseMapIfNeeded() {

    return new Promise( (resolve, reject) => {
      if (!this.mapService.isMap()) {
        console.log(this.mapService.isMap());
        this.mapService.initialiseMap(this.geoService.getPathCoG(this.geoJSON.bbox), 10).then( () => {
          resolve();
        })
      } else { resolve(); }
    })

  }

  ngOnDestroy() {
    this.pathIdSubscription.unsubscribe();
  }

}
