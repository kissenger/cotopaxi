import { Injectable } from '@angular/core';
import { HttpService } from 'src/app/shared/services/http.service';
import { DataService } from './data.service';
import { GeoService } from './geo.service';
import * as globals from 'src/app/shared/globals';

declare var google: any;

@Injectable({
  providedIn: 'root'
})
export class ChartsService {

  constructor(
    public httpService: HttpService,
    public geoService: GeoService,
    public dataService: DataService
  ) {
  }

  plotChart(htmlElement, chartData, colourArray) {

    if (chartData[0].length === 0) {
      chartData = [[0.1], [0.1]];
    } else {
      chartData = this.processChartData(chartData);
    }

    google.charts.load('current', {'packages': ['corechart']});
    google.charts.setOnLoadCallback(() => {

      const chart = new google.visualization.LineChart(htmlElement);
      const data = google.visualization.arrayToDataTable( this.transposeArray(chartData), true);
      const maxX = chartData[0][chartData[0].length - 1];

      const options = {
        title: 'Elevation (' + globals.units.elevation + ') vs distance (' + globals.units.distance + ')',
        colors: colourArray,
        hAxis: {
          format: maxX > 10 ? '0' : '0.0',
          ticks: this.getHorzTicks(maxX),
          viewWindowMode: 'explicit',
          viewWindow: {
            min: 0
          }
        },
        vAxis: {
          textPosition: 'in',
          format: '0',
          viewWindowMode: 'explicit',
          // ticks: [-100, 100, 200, 300, 400, 500],
          // viewWindow: {
            // min: -10,
            // max: 10
          // }
        },
        legend: 'none',
        chartArea: {
          left: '5',
          width: '180',
          height: '150'
        }
      };

      return chart.draw(data, options);

    });

  }

  transposeArray(twoDimArray) {
    return twoDimArray[0].map( (col, i) => twoDimArray.map(row => row[i]) );
  }


  // TODO there should be a cleaver way to do this more succinctly
  getHorzTicks(maxValue) {
    const nIntervals = maxValue === 0.1 ? 1 : 5;
    const factor = maxValue > 10 ? 1 : 10;
    const ticks = [];
    let tickValue = 0;

    do {
      tickValue += Math.ceil(maxValue / nIntervals * factor) / factor;
      ticks.push(tickValue);
    } while (tickValue < maxValue);

    return ticks;
  }

  processChartData(chData) {

      // arrange elevation data for plttoing on charts - first step convert to dsired units
      let xData;
      if (globals.units.distance === 'miles') {
        xData = chData[0].map( (m) => m / 1000.0 * globals.KM_TO_MILE);
      } else {
        xData = chData[0].map( (m) => m / 1000.0);
      }

      let yData = chData.slice(1);
      if (globals.units.elevation === 'ft' ) {
        yData = yData.map( (col) => col.map( (m) => m === null ? null : m * globals.M_TO_FT));
      } else {
        yData = yData.map( (col) => col.map( (m) => m ));
      }

      return [xData, ...yData];

  }

}
