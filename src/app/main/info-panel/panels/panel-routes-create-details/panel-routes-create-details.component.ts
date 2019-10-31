import { Component, OnInit } from '@angular/core';
import * as globalVars from 'src/app/app-services/globals';
import { DataService } from 'src/app/app-services/data.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-panel-routes-create-details',
  templateUrl: './panel-routes-create-details.component.html',
  styleUrls: ['./panel-routes-create-details.component.css']
})
export class PanelRoutesCreateDetailsComponent implements OnInit {

  private isMinimised = false;
  private pathStatsSubs;
  private pathStats = {
    distance: 0,
    ascent: 0,
    descent: 0,
    lumpiness: 0,
    nPoints: 0
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
    this.pathStatsSubs = this.dataService.pathStats.subscribe( (pathStats) => {
      this.pathStats = pathStats;
    })
  }

  onClick() {
    this.isMinimised = !this.isMinimised;
    this.icon = this.isMinimised ? '+' : '-';
  }
}
