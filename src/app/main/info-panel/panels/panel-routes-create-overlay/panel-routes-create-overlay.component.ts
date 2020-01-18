import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpService } from 'src/app/shared/services/http.service';
import {  Router } from '@angular/router';
import * as globalVars from 'src/app/shared/globals';
import { DataService } from 'src/app/shared/services/data.service';
import { MapCreateService } from 'src/app/shared/services/map-create.service';

@Component({
  selector: 'app-panel-routes-create-overlay',
  templateUrl: './panel-routes-create-overlay.component.html',
  styleUrls: ['./panel-routes-create-overlay.component.css']
})
export class PanelRoutesCreateOverlayComponent implements OnInit {

  private htmlData = [];
  private pathId: string;
  private pathIdArray: Array<string> = [];
  private isNoPathsToPlot: Boolean = false;
  private DEBUG = false;
  private units = globalVars.units;

  constructor(
    private httpService: HttpService,
    private router: Router,
    private dataService: DataService,
    private mapCreateService: MapCreateService
    ) {}

  ngOnInit() {

    // on first load, get the current view from the map service
    const bbox = this.mapCreateService.getMapBounds();
    this.updateList(bbox);

    // then subscripe to emitter, which is sent from map-service when any movement of the map has finished
    this.dataService.mapBoundsEmitter.subscribe( (bbox) => {
      this.updateList(bbox);
    })
  } 


  /**
  * Get list of routes that intersect the current map view
  * @param currentBbox bounding box of the current map view
  */
  updateList(currentBbox: Array<number>) {

    this.httpService.getIntersectingRoutes(currentBbox).subscribe( pathsList => {

      this.isNoPathsToPlot = pathsList.length === 0 ? true : false;
      this.htmlData = pathsList;

    });

  }


  /**
   * Resets list item highlight and requests new map display
   * @param idFromClick id of path requested
   */
  onLineClick(idFromClick: string) {
    this.dataService.pathIdEmitter.emit(idFromClick);
    if (this.pathIdArray.includes(idFromClick)) {
      this.pathIdArray.splice(this.pathIdArray.indexOf(idFromClick), 1);
    } else {
      this.pathIdArray.push(idFromClick);
    }
    
  }

  /**
  * Request additional items in list
  */
//  onRefreshClick() {
//   this.updateList(false);
// }

  /**
   * function used in html template - returns the css classes according to some conditions
   * @param id id of the list item being processed
   * @param i index of the list item being processed
   */
  getCssClass(id: string, i: Number) {
    let cssClass = '';
    if (this.pathIdArray.includes(id)) { cssClass += 'highlight-div '; }
    if (i === 0) { cssClass += 'border-top'; }
    
    return cssClass;
  }

  /**
   * Actions to do when component is destroyed
   */
  ngOnDestroy() {
  }


}
