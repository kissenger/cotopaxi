import { Component, OnInit, OnDestroy } from '@angular/core';
import * as globals from 'src/app/shared/globals';
import { DataService } from 'src/app/shared/services/data.service';
import { Router } from '@angular/router';
import { pathStats } from 'src/app/shared/interfaces';
import { HttpService } from 'src/app/shared/services/http.service';
import { MultiPath } from 'src/app/shared/classes/path-classes';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-panel-routes-create-details',
  templateUrl: './panel-routes-create-details.component.html',
  styleUrls: ['./panel-routes-create-details.component.css']
})
export class PanelRoutesCreateDetailsComponent implements OnInit, OnDestroy {

  private activePathSubscription: Subscription;
  private pathStats: pathStats = {
    distance: 0,
    nPoints: 0,
    elevations: 
      { ascent: 0,
        descent: 0,
        lumpiness: 0,
        maxElev: 0,
        minElev: 0}
  };
  // private isMinimised = false;
  // private icon = '-';
  private units = globals.units;
  private pathName: string = '';
  private pathDescription: string = '';
  private isElevations: boolean;

  constructor(
    private dataService: DataService,
    private httpService: HttpService,
    private router: Router
  ) {}


  ngOnInit() {

    // both created and imported paths data are sent from map-service when the geoJSON is plotted: listen for the broadcast
    this.activePathSubscription = this.dataService.activePathEmitter.subscribe( (geoJSON) => {

      if (geoJSON.features.length === 0) {
        this.resetPathStats();
      } else {
        this.pathStats = geoJSON.features[0].properties.stats;
        this.pathName = geoJSON.features[0].properties.info.name;
        this.pathDescription =  geoJSON.features[0].properties.info.description;
        this.isElevations = geoJSON.features[0].properties.info.isElevations;
      }
    
    })

  }

  resetPathStats() {
    this.pathStats = {
      distance: 0,
      nPoints: 0,
      elevations: { ascent: 0, descent: 0, lumpiness: 0, maxElev: 0, minElev: 0 }
    };
  }

  onSave() {
    
    
    // activePath is stored from two locations - both are full geoJSON descriptions of the path:
    // - when a route is created on the map,  mapCreateService saves each time a new chunk of path is added
    // - when a route is imported, the backend sends the geoJSON, which is in turned saved by panel-routes-list-options
    const newPath = this.dataService.getFromStore('activePath', false).pathAsGeoJSON;
    const source = this.dataService.getFromStore('activePath', false).source;
    this.dataService.showStore();

    // newPath.creationType is set in the appropriate components to help us distinguish
    // imported file, beackend only needs to knw the pathType, pathId, name and description, so create theis object and call http
    if (source === 'map') {
      const sendObj = {
        pathId: newPath.properties.pathId, 
        pathType: newPath.properties.info.pathType,
        name: this.pathName,
        description: this.pathDescription
      };
      this.httpService.saveImportedPath(sendObj).subscribe( () => {
        this.router.navigate(['/route/list/']);
      })

    // path created on map, backend needs the whole shebang but as new path object will be created, we should only send it what it needs
    } else if (source === 'created') {
      const sendObj = {
        coords: newPath.features[0].geometry.coordinates, 
        elevs: newPath.features[0].properties.params.elev,
        name: this.pathName,
        description: this.pathDescription
      };
      this.httpService.saveCreatedRoute(sendObj).subscribe( () => {
        this.router.navigate(['/route/list/']);
      })      
    }

  }

  onCancel() {
    this.router.navigate(['/route/list/']);

  }
  // onClick() {
  //   this.isMinimised = !this.isMinimised;
  //   this.icon = this.isMinimised ? '+' : '-';
  // }


  ngOnDestroy() {
    this.activePathSubscription.unsubscribe();

    this.httpService.flushDatabase().subscribe( () => {
      console.log('db flushed');
    })
  }

}
