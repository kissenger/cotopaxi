import { Component, OnInit } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit {

  constructor() { }

  ngOnInit() {

  // mapboxgl.accessToken = 'pk.eyJ1Ijoia2lzc2VuZ2VyIiwiYSI6ImNrMWYyaWZldjBtNXYzaHFtb3djaDJobmUifQ.ATRTeTi2mygBXAoXd42KSw';

  // let map = new mapboxgl.Map({
  //   container: 'map', // container id
  //   style: 'mapbox://styles/mapbox/streets-v11', // stylesheet location
  //   center: [-74.50, 40], // starting position [lng, lat]
  //   zoom: 9 // starting zoom
  //   });
    const accessToken = 'pk.eyJ1Ijoia2lzc2VuZ2VyIiwiYSI6ImNrMWYyaWZldjBtNXYzaHFtb3djaDJobmUifQ.ATRTeTi2mygBXAoXd42KSw';
    Object.getOwnPropertyDescriptor(mapboxgl, 'accessToken').set(accessToken);

    const map = new mapboxgl.Map({
      container: 'map', // container id
      style: 'mapbox://styles/mapbox/streets-v11', // stylesheet location
      center: [-74.50, 40], // starting position [lng, lat]
      zoom: 9 // starting zoom
    });
  }
}
