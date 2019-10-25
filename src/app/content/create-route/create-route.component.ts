import { Component, OnInit, OnDestroy } from '@angular/core';
import { MapService } from 'src/app/map.service'
import { NewRouteService } from 'src/app/map.service'
import { DataService } from 'src/app/data.service';



@Component({
  selector: 'app-create-route',
  templateUrl: './create-route.component.html',
  styleUrls: ['./create-route.component.css']
})
export class CreateRouteComponent implements OnInit, OnDestroy {

  private menuSubs;

  constructor(
    private dataService: DataService,
    private newRoute: NewRouteService
    ) { }

  ngOnInit() {

    // initialise the map and launch createroute
    let startPosition: mapboxgl.LngLatLike = [0,52];
    this.newRoute.initialiseMap(startPosition).then( () => {
      this.newRoute.createRoute();
    });
    
    // listen for menu commands
    this.menuSubs = this.dataService.menuClick.subscribe( (fromMenu) => {
      if (fromMenu.command) {
        if (fromMenu.command === 'undo') { this.newRoute.undo(); }
        if (fromMenu.command === 'close') { this.newRoute.closePath(); }
        if (fromMenu.command === 'clear') { this.newRoute.clearPath(); }
      } else { 
        let optionKey = Object.keys(fromMenu.option)[0];
        this.newRoute.options[optionKey] = fromMenu.option[optionKey]; 
      }
    })

  }    

  ngOnDestroy() {
    this.menuSubs.unsubscribe();
  }

  
}
