import { Component, OnInit, OnDestroy, ContentChildren, QueryList } from '@angular/core';
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
  private chartData;
  private colourArray;
  private activeTab;
  // private chartTitle = 'Elevation (' + globals.units.elevation + ') vs distance (' + globals.units.distance + ')';


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

  // ngAfterContentInit() {console.log(this.query);}

  ngOnInit() {

    
    

    /**
     * START OF HORRIBLE HORRIBLE GOOGLE CHARTS HACK
     * TODO: find a better solution
     * PROBLEM: Google charts has a bug whereby the widths dont render correctly if the component is not visible when the chart is drawn.
     * eg https://stackoverflow.com/questions/43401936/issue-with-displaying-google-chart-in-a-bootstrap-tab
     * SOLUTION: I cannot get anything else to work, so use a delay to ensure that the elemtn is visible before the chart is drawn
     */

    this.dataService.activeTabEmitter.subscribe( (activeTab: string) => {
      if (activeTab === "Details") {
        setTimeout(() => {
          this.chartsService.plotChart(document.getElementById('chart_div'), this.chartData, this.colourArray);
        }, 200);
      }
    })

    /** 
     * END OF HORRIBLE HORRIBLE GOOGLE CHARTS HACK
     */

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

      // work out the data to plot on chart
      // loops through the features, creating an array of the form:
      // [[x1, x2, x3, x4, x5, ....],
      //  [e1, e2,   ,   ,   , ....],
      //  [  ,   , e3, e4, e5, ....]]
      // where x is cumDist, e is elevation point, and spaces are null points
      this.chartData = [geoJson.properties.params.cumDistance];
      this.colourArray = [];
      let x = 0;

      geoJson.features.forEach( feature => {
        const y = geoJson.properties.params.cumDistance.length - feature.properties.params.elev.length - x;
        this.chartData.push( Array(x).fill(null).concat(feature.properties.params.elev).concat(Array(y).fill(null)) );
        x += feature.properties.params.elev.length - 1;
        this.colourArray.push(feature.properties.lineColour);
      });
      
      // console.log(this.col)
    
    })



  }


  ngOnDestroy() {
    this.pathPropsSubscription.unsubscribe();

  }

}
