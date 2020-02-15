import { Injectable } from '@angular/core';
import { HttpService } from 'src/app/shared/services/http.service'
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

    let frigFlag = false;
    try {
      if (chartData[0].length === 0) {
        chartData = [[0.1],[0.1]];
        frigFlag = true;
      } else {
        chartData = this.processChartData(chartData);
      }
    } catch {
      return false
    }
    google.charts.load('current', {'packages':['corechart']});
    google.charts.setOnLoadCallback(() =>{

      let chart = new google.visualization.LineChart(htmlElement);
      let data = google.visualization.arrayToDataTable(this.transposeArray(chartData), true);
      let maxX = chartData[0][chartData[0].length-1];

      let options = {
        // series: frigFlag ? {0: {color: 'transparent'}} : {},
        title: 'Elevation (' + globals.units.elevation + ') vs distance (' + globals.units.distance + ')',
        colors: colourArray,
        hAxis: {
          // textPosition: frigFlag ? 'none' : '',
          format: maxX > 10 ? '0' : '0.0',
          ticks: this.getHorzTicks(maxX),
          viewWindowMode:'explicit',
          viewWindow:{
            min: 0
          }
        },
        vAxis: {
          textPosition: 'in',
          format: '0',
          // ticks: [0,50,100],
          viewWindowMode:'explicit',
          // viewWindow:{
          //   min: 0
          // }
          viewWindow:{
            min: 0
          }
        },
        legend: 'none',
        chartArea: {
          left: '5',
          width: '180',
          height: '150'
        }

        // chartArea: {
        //   // leave room for y-axis labels
        //   width: '94%'
        // },
        // width: '100%'

      };

      return chart.draw(data, options);

    });

  }

  transposeArray(twoDimArray) {
    return twoDimArray[0].map( (col, i) => twoDimArray.map(row => row[i]) );
  }


  //TODO there should be a cleaver way to do this more succinctly
  getHorzTicks(maxValue) {
    let nIntervals = maxValue === 0.1 ? 1 : 5;
    let factor = maxValue > 10 ? 1 : 10;
    let ticks = [];
    let tickValue = 0;

    do {
      tickValue += Math.ceil(maxValue / nIntervals * factor) / factor;
      ticks.push(tickValue);
    } while (tickValue < maxValue)

    return ticks
  }

  processChartData(chData) {

      // arrange elevation data for plttoing on charts - first step convert to dsired units
      if (globals.units.distance === 'miles') {
        var xData = chData[0].map( (m) => m / 1000.0 * globals.KM_TO_MILE);
      } else {
        var xData = chData[0].map( (m) => m / 1000.0);
      }

      let yData = chData.slice(1);
      if (globals.units.elevation === 'ft' ) {
        yData = yData[0].map( () => yData.Map((m) => m * globals.M_TO_FT));
      }

      // console.log(dist, elevs)
      return [xData, ...yData]

  }

}
