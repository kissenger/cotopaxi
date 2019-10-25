import { Component, OnInit, OnDestroy } from '@angular/core';
import { DataService } from 'src/app/data.service';
import * as globalVars from '../../globals';

@Component({
  selector: 'app-info-panel',
  templateUrl: './info-panel.component.html',
  styleUrls: ['./info-panel.component.css']
})
export class InfoPanelComponent implements OnInit, OnDestroy {

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

  constructor(
    private dataService: DataService
  ) {}

  ngOnInit() {
    this.pathStatsSubs = this.dataService.pathStats.subscribe( (pathStats) => {
      this.pathStats = pathStats;
    })
    console.log(this.units);
  }

  onClick() {
    this.isMinimised = !this.isMinimised;
    this.icon = this.isMinimised ? '+' : '-';
  }

  ngOnDestroy() {
    this.pathStatsSubs.unsubscribe();
  }

}
