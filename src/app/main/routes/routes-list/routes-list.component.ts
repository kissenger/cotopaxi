import { Component, OnInit, OnDestroy, ComponentFactoryResolver } from '@angular/core';
import { MapService } from 'src/app/shared/services/map.service';
import { DataService } from 'src/app/shared/services/data.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpService } from 'src/app/shared/services/http.service';
import { Subscription } from 'rxjs';
import { GeoService } from 'src/app/shared/services/geo.service';

@Component({
  selector: 'app-routes',
  templateUrl: './routes-list.component.html',
  styleUrls: ['./routes-list.component.css']
})

export class RoutesListComponent implements OnInit, OnDestroy {

  private pathIdSubscription: Subscription;
  private geoJSON;

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
        this.geoJSON = result.geoJson;

        // as initialisation will temporarily show default location, only run it if map doesnt currently exist
        this.initialiseMapIfNeeded().then( () => {
          let styleOptions = {lineWidth: 3, lineColor: 'auto', lineOpacity: 0.5};
          this.mapService.plotSingleGeoJson(result.geoJson, styleOptions);
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
