import { Component, OnInit, OnDestroy } from '@angular/core';
import { MapService } from 'src/app/map.service'
import { DataService } from 'src/app/data.service';



@Component({
  selector: 'app-create-route',
  templateUrl: './create-route.component.html',
  styleUrls: ['./create-route.component.css']
})
export class CreateRouteComponent implements OnInit, OnDestroy {

  private menuSubs;

  constructor(
    private mapService: MapService,
    private dataService: DataService
    ) { }

  ngOnInit() {

    this.mapService.showMap([0,52]);

    this.mapService.createRoute();

    this.menuSubs = this.dataService.menuClick.subscribe( (menuItem) => {
      if (menuItem === 'undo') {
        this.mapService.undo();
      } else if (menuItem === 'close') {
        this.mapService.closePath();
      } else if (menuItem === 'roads' || menuItem === 'paths' || menuItem === 'none') {
        this.mapService.setSnap(menuItem);
      }
    });

  }    

  ngOnDestroy() {
    this.menuSubs.unsubscribe();
  }

  
}
