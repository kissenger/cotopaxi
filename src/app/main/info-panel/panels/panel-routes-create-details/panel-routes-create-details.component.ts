import { Component, OnInit } from '@angular/core';
import * as globalVars from 'src/app/shared/globals';
import { DataService } from 'src/app/shared/services/data.service';
import { Router } from '@angular/router';
import { pathStats } from 'src/app/shared/interfaces';

@Component({
  selector: 'app-panel-routes-create-details',
  templateUrl: './panel-routes-create-details.component.html',
  styleUrls: ['./panel-routes-create-details.component.css']
})
export class PanelRoutesCreateDetailsComponent implements OnInit {

  private isMinimised = false;
  private pathStatsSubs;
  private pathStats: pathStats = {
    distance: 0,
    nPoints: 0,
    elevations: 
      { ascent: 0,
        descent: 0,
        lumpiness: 0,
        maxElevation: 0,
        minElevation: 0,
        badElevData: false }
  };
  private icon = '-';
  private units = globalVars.units;
  private routeName: string = '';
  private routeDesc: string = '';

  constructor(
    private dataService: DataService,
    private router: Router
  ) {}


  ngOnInit() {
    // subscribe to any path stats that are sent from the map component
    this.pathStatsSubs = this.dataService.pathStats.subscribe( (pathStats: pathStats) => {
      if (!pathStats.elevations) {
        pathStats.elevations = {ascent: 0, descent: 0, maxElevation: 0, minElevation: 0, lumpiness: 0, badElevData: false};
      }
      this.pathStats = pathStats;
    })
  }

  onClick() {
    this.isMinimised = !this.isMinimised;
    this.icon = this.isMinimised ? '+' : '-';
  }
}
