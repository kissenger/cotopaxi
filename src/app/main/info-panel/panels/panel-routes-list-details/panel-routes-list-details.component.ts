import { Component, OnInit, OnDestroy } from '@angular/core';
import { DataService } from 'src/app/shared/services/data.service';
import { pathStats } from 'src/app/shared/interfaces';
import * as globals from 'src/app/shared/globals';
import { Subscription } from 'rxjs';
import { ChartsService } from 'src/app/shared/services/charts-service';

@Component({
  selector: 'app-panel-routes-list-details',
  templateUrl: './panel-routes-list-details.component.html',
  styleUrls: ['./panel-routes-list-details.component.css']
})
export class PanelRoutesListDetailsComponent implements OnInit, OnDestroy {

  private pathPropsSubscription: Subscription;
  private pathName: string = "";
  private pathDescription: string = "";
  private chartDataArray: Array<Array<number>>
  private isElevations: boolean;
  private wikiLink: string = globals.links.wiki.elevations;
  private pathCategory: string;
  private pathType: string;

  private pathStats: pathStats = {
    distance: 0,
    nPoints: 0,
    elevations: 
      { ascent: 0,
        descent: 0,
        lumpiness: 0,
        maxElev: 0,
        minElev: 0 }
  };
  private units = globals.units;

  constructor(
    private dataService: DataService,
    private chartsService: ChartsService
  ) { }

  ngOnInit() {

    // listen for data sent from map service
    this.pathPropsSubscription = this.dataService.activePathEmitter.subscribe( (geoJson) => {
      if (!geoJson.properties.stats.elevations) {
        this.pathStats.elevations = {ascent: 0, descent: 0, maxElev: 0, minElev: 0, lumpiness: 0};
      }
      this.pathStats = geoJson.properties.stats;
      this.pathName = geoJson.properties.info.name;
      this.pathCategory = geoJson.properties.info.category;
      this.pathType = geoJson.properties.info.pathType;
      this.pathDescription = geoJson.properties.info.description;
      this.isElevations = geoJson.properties.info.isElevations;

      // arrange elevation data for plttoing on charts - first step convert to dsired units
      if (globals.units.distance === 'miles') {
        var dist = geoJson.properties.params.cumDistance.map( (km) => km * globals.KM_TO_MILE);
      } else {
        var dist = geoJson.properties.params.cumDistance;
      }

      if (globals.units.elevation === 'ft' ) {
        var elevs = geoJson.properties.params.elev.map( (m) => m * globals.M_TO_FT);
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
