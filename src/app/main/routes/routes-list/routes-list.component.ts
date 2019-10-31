import { Component, OnInit, OnDestroy } from '@angular/core';
import { MapService } from 'src/app/app-services/map.service';
import { DataService } from 'src/app/app-services/data.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-routes',
  templateUrl: './routes-list.component.html',
  styleUrls: ['./routes-list.component.css']
})
export class RoutesListComponent implements OnInit, OnDestroy {

  private menuSubs;
  private paramSubs: any;
  private id: string;

  constructor(
    private dataService: DataService,
    private mapService: MapService,
    private activatedRouter: ActivatedRoute,
    private router: Router
    ) { } 

  ngOnInit() {

    // initialise the map and launch createroute
    let startPosition: mapboxgl.LngLatLike = [0,52];
    this.mapService.initialiseMap(startPosition).then( () => {

    });
    // this.paramSubs = this.activatedRouter.params.subscribe(params => {
    //   this.id = params.id;
    // })

  }

  
  ngOnDestroy() {
    // this.menuSubs.unsubscribe();
  }

}
