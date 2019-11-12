import { Component, OnInit, OnDestroy } from '@angular/core';
import { MapCreateService } from 'src/app/shared/services/map-create.service'
import { DataService } from 'src/app/shared/services/data.service';
import { tsCoordinate } from 'src/app/shared/interfaces';


@Component({
  selector: 'app-routes-create',
  templateUrl: './routes-create.component.html',
  styleUrls: ['./routes-create.component.css']
})
export class RoutesCreateComponent implements OnInit, OnDestroy {

  private menuSubs;

  constructor(
    private dataService: DataService,
    private mapCreateService: MapCreateService
    ) { }

  ngOnInit() {

    // initialise the map and launch createroute
    let startPosition: tsCoordinate = {lat: 51, lng: -1};
    this.mapCreateService.initialiseMap(startPosition).then( () => {
      this.mapCreateService.createRoute();
    });
    
    // listen for menu commands
    this.menuSubs = this.dataService.menuClick.subscribe( (fromMenu) => {
      if (fromMenu.command) {
        if (fromMenu.command === 'undo') { this.mapCreateService.undo(); }
        if (fromMenu.command === 'close') { this.mapCreateService.closePath(); }
        if (fromMenu.command === 'clear') { this.mapCreateService.clearPath(); }
      } else { 
        let optionKey = Object.keys(fromMenu.option)[0];
        this.mapCreateService.getOptions()[optionKey] = fromMenu.option[optionKey]; 
      }
    })

  }    

  ngOnDestroy() {
    this.menuSubs.unsubscribe();
  }

  
}
