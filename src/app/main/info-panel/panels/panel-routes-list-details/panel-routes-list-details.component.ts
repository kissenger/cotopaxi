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

    // listen for data sent from map service
    this.pathPropsSubscription = this.dataService.activePathEmitter.subscribe( (geoJson) => {
      console.log(geoJson);
      if (!geoJson.properties.stats.elevations) {
        this.pathStats.elevations = {ascent: 0, descent: 0, maxElev: 0, minElev: 0, lumpiness: 0, badElevData: false};
      }
      this.pathStats = geoJson.properties.stats;
      this.pathName = geoJson.properties.info.name;
      this.pathDescription = geoJson.properties.info.description;
    })

  }

  ngOnDestroy() {
    this.pathPropsSubscription.unsubscribe();

  }

}
