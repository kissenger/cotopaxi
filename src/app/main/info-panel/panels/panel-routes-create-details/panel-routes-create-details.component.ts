import { Component, OnInit, OnDestroy } from '@angular/core';
import * as globalVars from 'src/app/shared/globals';
import { DataService } from 'src/app/shared/services/data.service';
import { Router } from '@angular/router';
import { pathStats } from 'src/app/shared/interfaces';
import { HttpService } from 'src/app/shared/services/http.service';
import { MultiPath } from 'src/app/shared/classes/path-classes';

@Component({
  selector: 'app-panel-routes-create-details',
  templateUrl: './panel-routes-create-details.component.html',
  styleUrls: ['./panel-routes-create-details.component.css']
})
export class PanelRoutesCreateDetailsComponent implements OnInit, OnDestroy {

  private isMinimised = false;
  private pathStatsSubs;
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
  private routeName: string = '';
  private routeDesc: string = '';

  constructor(
    private dataService: DataService,
    private httpService: HttpService,
    private router: Router
  ) {}


  ngOnInit() {
    // subscribe to any path stats that are sent from the map component
    this.pathStatsSubs = this.dataService.pathStats.subscribe( (pathStats: pathStats) => {
      if (!pathStats.elevations) {
        pathStats.elevations = {ascent: 0, descent: 0, maxElev: 0, minElev: 0, lumpiness: 0, badElevData: false};
      }
      this.pathStats = pathStats;
      console.log(pathStats);
    })


  }

  onSave() {
    
    const pathObj = this.dataService.pathObject;
    if (pathObj['type'] === 'newRoute') {
      
      // if the pathObject contains data, then it is a new route created on the front end

      pathObj['name'] = this.routeName;
      pathObj['description'] = this.routeDesc;
      this.httpService.saveCreatedRoute(pathObj).subscribe( (response) => {
        console.log(response);
      })

    } else if (pathObj['type'] === 'importedPath') {
      // if the pathObject does not exist, then it is a loaded gpx file already stored in 
      // the db, we just need to sset the saved flag to true
      pathObj['info']['name'] = this.routeName;
      pathObj['info']['description'] = this.routeDesc;
      this.httpService.saveImportedPath(pathObj).subscribe( (response) => {
        console.log(response);
      })
    }

  }

  onCancel() {
    this.router.navigate(['']);

  }
  // onClick() {
  //   this.isMinimised = !this.isMinimised;
  //   this.icon = this.isMinimised ? '+' : '-';
  // }

  ngOnDestroy() {
    this.pathStatsSubs.unsubscribe();
  }

}
