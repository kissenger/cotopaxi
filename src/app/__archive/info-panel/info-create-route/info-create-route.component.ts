import { Component, OnInit, OnDestroy } from '@angular/core';
import { DataService } from 'src/app/app-services/data.service';
import * as globalVars from '../../../app-services/globals';
import { Router } from '@angular/router';

@Component({
  selector: 'app-info-create-route',
  templateUrl: './info-create-route.component.html',
  styleUrls: ['./info-create-route.component.css']
})
export class InfoCreateRouteComponent implements OnInit {

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
  private page;
  private timer;
  private isReviewPage = false;
  constructor(
    private dataService: DataService,
    private router: Router
  ) {}
  private routeName: string = '';
  private routeDesc: string = '';


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
