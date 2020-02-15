import { Component, OnInit, OnDestroy, Input, ViewChild, TemplateRef } from '@angular/core';
import * as globals from 'src/app/shared/globals';
import { DataService } from 'src/app/shared/services/data.service';
import { Router } from '@angular/router';
import { HttpService } from 'src/app/shared/services/http.service';
import { Subscription } from 'rxjs';
import { ChartsService } from 'src/app/shared/services/charts-service';
import { TsUnits, TsPathStats } from 'src/app/shared/interfaces';

@Component({
  selector: 'app-panel-details',
  templateUrl: './panel-details.component.html',
  styleUrls: ['./panel-details.component.css']
})
export class PanelRoutesCreateDetailsComponent implements OnInit, OnDestroy {

  // local variables
  @Input() callingPage: string;
  private activePathSubscription: Subscription;
  private chartData: Array<Array<number>>;
  private colourArray: Array<string>;

  public pathName = '';
  public pathDescription = '';
  public isListPage: boolean;
  public isLong: boolean;
  public isElevations: boolean;
  public isHills: boolean;
  public isData: boolean;
  public units: TsUnits = globals.units;
  public wikiLink: string = globals.links.wiki.elevations;
  public pathCategory: string;
  public pathType: string;
  public pathStats: TsPathStats = {
    distance: 0,
    nPoints: 0,
    elevations:
      { ascent: 0,
        descent: 0,
        lumpiness: 0,
        maxElev: 0,
        minElev: 0},
    hills: []
  };

  constructor(
    private dataService: DataService,
    private httpService: HttpService,
    private router: Router,
    private chartsService: ChartsService
  ) {}

  ngOnInit() {

    // show form inputs and buttons only for review or create pages, not for list
    this.isListPage = this.callingPage === 'list';
    this.isData = true;

    this.chartsService.plotChart(document.getElementById('chart_div'), [[], []], []);

    // both created and imported paths data are sent from map-service when the geoJSON is plotted: listen for the broadcast
    this.activePathSubscription = this.dataService.activePathEmitter.subscribe( (geoJson) => {

      this.isData = true;
      if (geoJson.features.length === 0) {
        this.resetPathStats();
      } else {
        this.pathStats = geoJson.properties.stats;
        this.pathName = geoJson.properties.info.name;
        this.pathDescription =  geoJson.properties.info.description;
        this.pathCategory = geoJson.properties.info.category;
        this.pathType = geoJson.properties.info.pathType;
        this.isLong = geoJson.properties.info.isLong;
        this.isElevations = geoJson.properties.info.isElevations && !this.isLong;
        this.isHills = this.pathStats.hills.length > 0;
      }
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

      // then plot the chart
      // console.log(chartDataArray);
      // console.log(this.isElevations);
      this.chartsService.plotChart(document.getElementById('chart_div'), this.chartData, this.colourArray);

    });

  }

  resetPathStats() {
    this.pathStats = {
      distance: 0,
      nPoints: 0,
      elevations: { ascent: 0, descent: 0, lumpiness: 0, maxElev: 0, minElev: 0 }
    };
    this.isElevations = false;
    this.isLong = false;
  }

  onSave() {


    // activePath is stored from two locations - both are full geoJSON descriptions of the path:
    // - when a route is created on the map,  mapCreateService saves each time a new chunk of path is added
    // - when a route is imported, the backend sends the geoJSON, which is in turned saved by panel-routes-list-options
    const newPath = this.dataService.getFromStore('activePath', false);

    // path created on map, backend needs the whole shebang but as new path object will be created, we should only send it what it needs
    if (newPath.properties.pathId === '0000') {    // pathId for created route is set to 0000 in the backend
      const sendObj = {
        coords: newPath.features[0].geometry.coordinates,
        elevs: newPath.features[0].properties.params.elev,
        name: this.pathName,
        description: this.pathDescription
      };
      this.httpService.saveCreatedRoute(sendObj).subscribe( () => {
        this.router.navigate(['/route/list/']);
      });

    // imported file, backend only needs to knw the pathType, pathId, name and description, so create theis object and call http
    } else {
      const sendObj = {
        pathId: newPath.properties.pathId,
        pathType: newPath.properties.info.pathType,
        name: this.pathName,
        description: this.pathDescription
      };
      this.httpService.saveImportedPath(sendObj).subscribe( () => {
        this.router.navigate(['/route/list/']);
      });
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

    // this.httpService.flushDatabase().subscribe( () => {
    //   console.log('db flushed');
    // });
  }

}
