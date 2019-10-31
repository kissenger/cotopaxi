import { Component, OnInit } from '@angular/core';
import { MapService } from 'src/app/app-services/map.service';

@Component({
  selector: 'app-routes-review',
  templateUrl: './routes-review.component.html',
  styleUrls: ['./routes-review.component.css']
})
export class RoutesReviewComponent implements OnInit {

  constructor(
    private mapService: MapService
  ) { }

  ngOnInit() {

    // initialise the map and launch createroute
    let startPosition: mapboxgl.LngLatLike = [0,52];
    this.mapService.initialiseMap(startPosition).then( () => {

    });

  }

}
