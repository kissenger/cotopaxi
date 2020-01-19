import { Component, OnInit, OnDestroy } from '@angular/core';
import { DataService } from 'src/app/shared/services/data.service';
import { pathStats } from 'src/app/shared/interfaces';
import * as globalVars from 'src/app/shared/globals';
import { Subscription } from 'rxjs';
import { ChartsService } from 'src/app/shared/services/charts-service';

@Component({
  selector: 'app-panel-routes-list-details',
  templateUrl: './panel-routes-list-details.component.html',
  styleUrls: ['./panel-routes-list-details.component.css']
})
export class PanelRoutesListDetailsComponent implements OnInit, OnDestroy {

  private pathPropsSubscription: Subscription;
  private pathName: String = "";
  private pathDescription: String = "";
  private chartDataArray: Array<Array<number>>

  private pathStats: pathStats = {
    distance: 0,
    nPoints: 0,
    elevations: 
      { elevationStatus: '',
        ascent: 0,
        descent: 0,
        lumpiness: 0,
        maxElev: 0,
        minElev: 0,
        badElevData: false }
  };
  private units = globalVars.units;

  constructor(
    private dataService: DataService,
    private chartsService: ChartsService
  ) { }

  ngOnInit() {

    // listen for data sent from map service
    this.pathPropsSubscription = this.dataService.activePathEmitter.subscribe( (geoJson) => {
      if (!geoJson.properties.stats.elevations) {
        this.pathStats.elevations = {elevationStatus: '', ascent: 0, descent: 0, maxElev: 0, minElev: 0, lumpiness: 0, badElevData: false};
      }
      this.pathStats = geoJson.properties.stats;
      this.pathName = geoJson.properties.info.name;
      this.pathDescription = geoJson.properties.info.description;

      // arrange elevation data for plttoing on charts - first step convert to dsired units
      if (globalVars.units.distance === 'miles') {
        var dist = geoJson.properties.params.cumDistance.map( (km) => km * globalVars.KM_TO_MILE);
      } else {
        var dist = geoJson.properties.params.cumDistance;
      }

      if (globalVars.units.elevation === 'ft' ) {
        var elevs = geoJson.properties.params.elev.map( (m) => m * globalVars.M_TO_FT);
      } else {
        var elevs = geoJson.properties.params.elev;
      }

      // then plot the chart
      this.chartDataArray = [dist, elevs];
      this.chartsService.plotChart(document.getElementById('chart_div'), this.chartDataArray);
    })



  }

  ngOnDestroy() {
    this.pathPropsSubscription.unsubscribe();

  }

}
