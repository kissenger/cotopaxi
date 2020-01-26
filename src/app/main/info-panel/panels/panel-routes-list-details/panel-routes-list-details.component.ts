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
  private wikiLink: string = globals.links.wiki.elevations;
  private pathCategory: string;
  private pathType: string;
  private isElevations: boolean = false;
  private isLong: boolean = false;


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
      this.isLong = geoJson.properties.info.isLong;
      this.isElevations = (geoJson.properties.info.isElevations && !this.isLong) ? true : false;
      console.log(this.isLong, this.isElevations);

      // then plot the chart
      const chartDataArray = [geoJson.properties.params.cumDistance, geoJson.properties.params.elev];
      this.chartsService.plotChart(document.getElementById('chart_div'), chartDataArray);
    })



  }

  ngOnDestroy() {
    this.pathPropsSubscription.unsubscribe();

  }

}
