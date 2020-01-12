import { Component, OnInit } from '@angular/core';
import { MapService } from 'src/app/shared/services/map.service';
import { DataService } from 'src/app/shared/services/data.service';
import { Router } from '@angular/router';
import { tsCoordinate } from 'src/app/shared/interfaces';
import { Path } from 'src/app/shared/classes/path-classes';

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
      let startPosition: tsCoordinate = {lat: 51, lng: -1};
      this.mapService.initialiseMap(startPosition).then( () => {

        // plot the stored route
        let styleOptions = {lineWidth: 3, lineColor: 'auto', lineOpacity: 0.5};
        this.mapService.plotSingleGeoJson(geoJson, styleOptions);
        
      });
    }

  }

}
