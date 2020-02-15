import { Component, OnInit } from '@angular/core';
import { MapService } from 'src/app/shared/services/map.service';
import { DataService } from 'src/app/shared/services/data.service';
import { Router } from '@angular/router';
import { GeoService } from 'src/app/shared/services/geo.service';
import * as globals from 'src/app/shared/globals';

@Component({
  selector: 'app-routes-review',
  templateUrl: './routes-review.component.html',
  styleUrls: ['./routes-review.component.css']
})
export class RoutesReviewComponent implements OnInit {

  constructor(
    private mapService: MapService,
    private dataService: DataService,
    private router: Router,
    private geoService: GeoService
  ) { }

  ngOnInit() {

    const geoJSON = this.dataService.getFromStore('activePath', true).pathAsGeoJSON;

    console.log(geoJSON);

    if (typeof geoJSON === 'undefined') {
      this.router.navigate(['routes/list']);
    } else {

      // initialise the map
      this.mapService.initialiseMap(this.geoService.getPathCoG(geoJSON.bbox), 10).then( () => {

        // plot the stored route
        const plotOptions = {booReplaceExisting: false, booResizeView: true, booSaveToStore: true};
        this.mapService.addLayerToMap(geoJSON, {}, plotOptions);

      });
    }

  }

}
