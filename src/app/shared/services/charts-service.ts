import { Injectable } from '@angular/core';
import { HttpService } from 'src/app/shared/services/http.service'
import { DataService } from './data.service';
import { GeoService } from './geo.service';
import * as globals from 'src/app/shared/globals';
declare var google: any;

@Injectable({
  providedIn: 'root'
})
export class ChartsService{

  constructor(
    public httpService: HttpService,
    public geoService: GeoService,
    public dataService: DataService
    
    
  ) { 
    
  }

  plotChart(htmlElement, chartData) {

    const chartTitle = 'Elevation (' + globals.units.elevation + ') vs distance (' + globals.units.distance + ')'
    google.charts.load('current', {'packages':['corechart']});
    google.charts.setOnLoadCallback(() =>{
      let chart = new google.visualization.LineChart(htmlElement);
      let data = this.transposeArray(chartData);
      let options = {
        title: chartTitle,
        hAxis: {
          format: '0',
          ticks: this.getHorzTicks(chartData[0][chartData[0].length-1])
        },
        legend: 'none',
        chartArea: {
          left: '30',
          width: '160'
        }
      };

      return chart.draw(google.visualization.arrayToDataTable(data, true), options); 
    });

  }

  transposeArray(twoDimArray) {
    return twoDimArray[0].map((col, i) => twoDimArray.map(row => row[i]))
  }


  //TODO there should be a cleaver way to do this more succinctly
  getHorzTicks(maxValue) {
    const nInternalTicks = 4;
    let nIntervals = nInternalTicks + 1;
    let tickArray = [];
    for (let i = 0; i < nInternalTicks+1; i++) {
      tickArray.push(i * Math.ceil(maxValue / nIntervals))
    }
    tickArray.push( Math.ceil(maxValue) );
    return tickArray
  }

}