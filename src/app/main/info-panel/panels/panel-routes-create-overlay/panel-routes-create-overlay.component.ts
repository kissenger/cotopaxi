import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpService } from 'src/app/shared/services/http.service';
import * as globals from 'src/app/shared/globals';
import { DataService } from 'src/app/shared/services/data.service';
import { MapCreateService } from 'src/app/shared/services/map-create.service';
import { Subscription } from 'rxjs';
import { TsUnits, TsListData } from 'src/app/shared/interfaces';

@Component({
  selector: 'app-panel-routes-create-overlay',
  templateUrl: './panel-routes-create-overlay.component.html',
  styleUrls: ['./panel-routes-create-overlay.component.css']
})
export class PanelRoutesCreateOverlayComponent implements OnInit, OnDestroy {

  private subscription: Subscription;
  private pathIdArray: Array<string> = [];

  public listData: TsListData;
  public pathId: string;
  public isNoPathsToPlot = false;
  public units: TsUnits = globals.units;


  constructor(
    private httpService: HttpService,
    private dataService: DataService,
    private mapCreateService: MapCreateService
    ) {}

  ngOnInit() {

    // on first load, get the current view from the map service
    const bbox = this.mapCreateService.getMapBounds();
    this.updateList(bbox);

    // then subscripe to emitter, which is sent from map-service when any movement of the map has finished
    this.dataService.mapBoundsEmitter.subscribe( (bb) => {
      this.updateList(bb);
    });
  }


  /**
  * Get list of routes that intersect the current map view
  * @param currentBbox bounding box of the current map view
  */
  updateList(currentBbox: Array<number>) {

    this.subscription = this.httpService.getIntersectingRoutes(currentBbox).subscribe( pathsList => {
      this.isNoPathsToPlot = pathsList.length === 0 ? true : false;
      this.listData = pathsList;
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
   * function used in html template - returns the css classes according to some conditions
   * @param id id of the list item being processed
   * @param i index of the list item being processed
   */
  getCssClass(id: string, i: number) {
    let cssClass = '';
    if (this.pathIdArray.includes(id)) { cssClass += 'highlight-div '; }
    if (i === 0) { cssClass += 'border-top'; }

    return cssClass;
  }

  /**
   * Actions to do when component is destroyed
   */
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }


}
