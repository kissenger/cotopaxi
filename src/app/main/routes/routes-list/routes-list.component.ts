import { Component, OnInit, OnDestroy } from '@angular/core';
import { MapService } from 'src/app/shared/services/map.service';
import { DataService } from 'src/app/shared/services/data.service';
import { ActivatedRoute, Router } from '@angular/router';
import { tsCoordinate } from 'src/app/shared/interfaces';
import { HttpService } from 'src/app/shared/services/http.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-routes',
  templateUrl: './routes-list.component.html',
  styleUrls: ['./routes-list.component.css']
})
export class RoutesListComponent implements OnInit, OnDestroy {

  private desiredPathSubscription: Subscription;
  private menuSubs;
  private paramSubs: any;
  private startPosition: tsCoordinate = {lat: 51, lng: -1};

  constructor(
    private dataService: DataService,
    private mapService: MapService,
    private activatedRouter: ActivatedRoute,
    private router: Router,
    private httpService: HttpService
    ) { } 

  ngOnInit() {

    this.loadEmptyMap(); 
    
    this.desiredPathSubscription = this.dataService.desiredPathEmitter.subscribe( (desiredPathId) => {
      this.plotPathOnMap(desiredPathId);
    })

  }

  loadEmptyMap() {
    this.mapService.initialiseMap(this.startPosition).then( () => {
      // do nothing
    });
  }

  plotPathOnMap(id) {

    this.httpService.getPathById('route', id).subscribe( (result) => {
      
      // always useful to chuck this to console
      console.log(result.geoJson);

      // plot the requested routeId
      let styleOptions = {lineWidth: 3, lineColor: 'auto', lineOpacity: 0.5};
      this.mapService.plotSingleGeoJson(result.geoJson, styleOptions);

      // emit the stats to be used by details panel

    })
  }
  ngOnDestroy() {
    this.desiredPathSubscription.unsubscribe();
  }

}
