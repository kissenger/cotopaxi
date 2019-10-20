import { Component, OnInit } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import { GeoJSON, Feature } from 'geojson';
import { MapService } from 'src/app/map.service'



@Component({
  selector: 'app-map',
  templateUrl: './create-route.component.html',
  styleUrls: ['./create-route.component.css']
})
export class CreateRouteComponent implements OnInit {


  constructor(
    private mapService: MapService
    ) { }

  ngOnInit() {

    const map = this.mapService.showMap([0,52]);

    this.mapService.createRoute(map);



  }
}
