import { Component, OnInit, OnDestroy } from '@angular/core';
import * as globalVars from 'src/app/shared/globals';
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

  private isMinimised = false;
  private pathPropsSubscription: Subscription;
  private pathObjectSubs;
  private pathObject: MultiPath;
  private pathStats: pathStats = {
    distance: 0,
    nPoints: 0,
    elevations: 
      { ascent: 0,
        descent: 0,
        lumpiness: 0,
        maxElev: 0,
        minElev: 0,
        badElevData: false }
  };
  private icon = '-';
  private units = globalVars.units;
  private pathName: string = '';
  private pathDescription: string = '';

  constructor(
    private dataService: DataService,
    private httpService: HttpService,
    private router: Router
  ) {}


  ngOnInit() {
    // subscribe to any path stats that are sent from the map component
    this.pathPropsSubscription = this.dataService.activePathPropertiesEmitter.subscribe( (pathProps) => {
      console.log(pathProps);
      if (!pathProps.stats.elevations) {
        this.pathStats.elevations = {ascent: 0, descent: 0, maxElev: 0, minElev: 0, lumpiness: 0, badElevData: false};
      }
      this.pathStats = pathProps.stats;
      this.pathName = pathProps.info.name;
      this.pathDescription = pathProps.info.description;
    })



  }

  onSave() {
    
    const createdPathData = this.dataService.createdPathData;
    const importedPathData = this.dataService.importedPathData;
    console.log(createdPathData);
    console.log(importedPathData);

    // if createdPathData is not undefined, then we have a newly created path to send to the backend
    if (typeof createdPathData !== 'undefined') {
      createdPathData['name'] = this.pathName;
      createdPathData['description'] = this.pathDescription;
      this.httpService.saveCreatedRoute(createdPathData).subscribe( (response) => {
        console.log('saved path id: ', response.pathId);
        response.pathId
        this.router.navigate(['/route/list/']);
      })

    // if the importedPathData is not undefined, then it is a loaded gpx file already stored in 
    // the db, we just need to sset the saved flag to true
    } else if (typeof importedPathData !== 'undefined') {
      importedPathData['info']['name'] = this.pathName;
      importedPathData['info']['description'] = this.pathDescription;
      this.httpService.saveImportedPath(importedPathData).subscribe( (response) => {
        console.log('saved path id: ', response.pathId);
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
    this.pathPropsSubscription.unsubscribe();

    this.httpService.flushDatabase().subscribe( () => {
      console.log('db flushed');
    })
  }

}
