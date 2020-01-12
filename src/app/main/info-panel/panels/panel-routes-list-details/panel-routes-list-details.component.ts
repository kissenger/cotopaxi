import { Component, OnInit, OnDestroy } from '@angular/core';
import { DataService } from 'src/app/shared/services/data.service';
import { pathStats } from 'src/app/shared/interfaces';
import * as globalVars from 'src/app/shared/globals';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-panel-routes-list-details',
  templateUrl: './panel-routes-list-details.component.html',
  styleUrls: ['./panel-routes-list-details.component.css']
})
export class PanelRoutesListDetailsComponent implements OnInit, OnDestroy {

  private pathPropsSubscription: Subscription;
  private pathName: String = "";
  private pathDescription: String = "";

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
  private units = globalVars.units;

  constructor(
    private dataService: DataService
  ) { }

  ngOnInit() {

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

  ngOnDestroy() {
    this.pathPropsSubscription.unsubscribe();

  }

}
