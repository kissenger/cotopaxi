import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { HttpService } from 'src/app/shared/services/http.service';
import {  Router } from '@angular/router';
import * as globals from 'src/app/shared/globals';
import { DataService } from 'src/app/shared/services/data.service';
import { Subscription } from 'rxjs';
import { TsUnits, TsListArray } from 'src/app/shared/interfaces';
import { MapCreateService } from 'src/app/shared/services/map-create.service';

@Component({
  selector: 'app-panel-list',
  templateUrl: './panel-list.component.html',
  styleUrls: ['./panel-list.component.css']
})
export class PanelRoutesListListComponent implements OnInit, OnDestroy {

  @Input() callingPage: string;
  private subscription: Subscription;
  private listOffset = 0;
  private boundingBox: Array<number> = [];
  private pathIdArray: Array<string> = [];

  public listData: TsListArray = [];
  public pathId: string;
  public isEndOfList = false; // value is read in the html do dont be tempted to delete
  public units: TsUnits = globals.units;
  public numberOfRoutes: number;
  public numberOfLoadedRoutes: number;


  constructor(
    private httpService: HttpService,
    private dataService: DataService,
    private mapCreateService: MapCreateService,
  ) {}

  ngOnInit() {

    if (this.callingPage === 'create') {

      // if create page then we need to know the current view on map so we can get appropriate overlay paths
      if (this.mapCreateService.isMap()) {
        this.boundingBox = this.mapCreateService.getMapBounds();
        this.updateList(false);

        // then subscripe to emitter, which is sent from map-service when any movement of the map has finished
        // this.dataService.mapBoundsEmitter.subscribe( (bb) => {
        //   this.updateList(bb);
        // });
      }

    } else {
      this.updateList(true);
    }
  }


  /**
  * Get list data on component load or request for additional list items
  * @param booEmitFirstPathId true on first pass, false otherwise - to prevent path change when 'more' is pressed
  */
  updateList(booAutoSelectPathId: boolean) {

    console.log(this.boundingBox);
      this.subscription = this.httpService.getPathsList('route', this.listOffset, this.boundingBox).subscribe( pathsList => {
        if ( pathsList.length === 0 ) {
          this.numberOfRoutes = 0;

        } else {
          // compile data and confirm if we are at the end of the list yet
          console.log(this.listData);
          this.listData = this.listData.concat(pathsList);
          this.numberOfRoutes = this.listData[0].count;
          this.numberOfLoadedRoutes = this.listData.length;
          this.isEndOfList = this.numberOfLoadedRoutes === this.numberOfRoutes;
        }

        // emit the first id in the list and highlight that row
        if (booAutoSelectPathId) {
          this.pathId = this.listData[0].pathId;
          this.dataService.pathIdEmitter.emit(this.pathId);
        }
      });




  }

  // compileData(list) {


  // }

  /**
  * Request additional items in list
  */
  onMoreClick() {
    this.listOffset++;
    this.updateList(false);
  }


  /**
   * Resets list item highlight and requests new map display
   * @param idFromClick id of path requested
   */
  onLineClick(idFromClick: string) {

    // for overlaid paths, toggle highlighting on row
    if (this.callingPage === 'create') {
      this.dataService.pathIdEmitter.emit(idFromClick);
      if (this.pathIdArray.includes(idFromClick)) {
        this.pathIdArray.splice(this.pathIdArray.indexOf(idFromClick), 1);
      } else {
        this.pathIdArray.push(idFromClick);
      }

      // for basic list, do nothing if row if clicked again
    } else {
      if (idFromClick !== this.pathId) {
        this.pathId = idFromClick;
        this.dataService.pathIdEmitter.emit(idFromClick);
      }
    }
  }




  /**
   * function used in html template - returns the css classes according to some conditions
   * @param id id of the list item being processed
   * @param i index of the list item being processed
   */
  getCssClass(id: string, i: number) {
    let cssClass = '';
    if (this.callingPage === 'create') {
      if (this.pathIdArray.includes(id)) { cssClass += 'highlight-div '; }
    } else {
      if (id === this.pathId) { cssClass += 'highlight-div '; }
    }
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

