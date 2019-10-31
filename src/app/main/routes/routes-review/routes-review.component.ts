import { Component, OnInit } from '@angular/core';
import { MapService } from 'src/app/app-services/map.service';
import { DataService } from 'src/app/app-services/data.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-routes-review',
  templateUrl: './routes-review.component.html',
  styleUrls: ['./routes-review.component.css']
})
export class RoutesReviewComponent implements OnInit {

  constructor(
    private mapService: MapService,
    private dataService: DataService,
    private router: Router
  ) { }

  ngOnInit() {

    const geoJson = this.dataService.activePathToView;
    if (typeof geoJson === 'undefined') {
      this.router.navigate(['routes/list']);
    } else {

      // initialise the map 
      let startPosition: mapboxgl.LngLatLike = [0,52];
      this.mapService.initialiseMap(startPosition).then( () => {

        // plot the stored route
        let styleOptions = {lineWidth: 3, lineColor: 'auto', lineOpacity: 0.5}
        this.mapService.plotGeoJson(geoJson, styleOptions);
      });
    }

  }

}
