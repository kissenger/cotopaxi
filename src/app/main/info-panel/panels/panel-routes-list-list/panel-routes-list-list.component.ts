import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpService } from 'src/app/shared/services/http.service';
import {  Router } from '@angular/router';
import * as globals from 'src/app/shared/globals';
import { DataService } from 'src/app/shared/services/data.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-panel-routes-list-list',
  templateUrl: './panel-routes-list-list.component.html',
  styleUrls: ['./panel-routes-list-list.component.css']
})
export class PanelRoutesListListComponent implements OnInit, OnDestroy {

  private htmlData = [];
  private pathId: string;
  private listOffset = 0;
  private isEndOfList = false; // value is read in the html do dont be tempted to delete
  private DEBUG = false;
  private units = globals.units;
  private numberOfRoutes: number;
  private numberOfLoadedRoutes: number;
  private subscription: Subscription;

  constructor(
    private httpService: HttpService,
    private router: Router,
    private dataService: DataService
    ) {}

  ngOnInit() {
    this.updateList(true);
  } 


  /**
  * Get list data on component load or request for additional list items
  * @param booEmitFirstPathId true on first pass, false otherwise - to prevent path change when 'more' is pressed
  */
  updateList(booAutoSelectPathId: boolean) {

    // get list of paths
    this.subscription = this.httpService.getPathsList('route', this.listOffset).subscribe( pathsList => {

      // query returned data, so process it
      if ( typeof pathsList[0] !== 'undefined' ) {
        
        // compile data and confirm if we are at the end of the list yet
        this.htmlData = this.htmlData.concat(pathsList);
        console.log(this.htmlData);
        // if (!this.htmlData[0]['name']) { this.htmlData[0]['name'] = '' };
        // if (!this.htmlData[0]['description']) { this.htmlData[0]['description'] = '' };
        this.numberOfRoutes = this.htmlData[0].count;
        this.numberOfLoadedRoutes = this.htmlData.length;
        this.isEndOfList = this.numberOfLoadedRoutes === this.numberOfRoutes;

        // emit the first id in the list and highlight that row
        if (booAutoSelectPathId) {
          this.pathId = this.htmlData[0].pathId;
          this.dataService.pathIdEmitter.emit(this.pathId); 
        }
        
      } else {
        // no data in query, so navigate back with path id = 0 (ensures that  map loads)
        
      }

    });

  }

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

    if (idFromClick !== this.pathId) {
      this.pathId = idFromClick;
      this.dataService.pathIdEmitter.emit(idFromClick);
    }

  }

  /**
   * function used in html template - returns the css classes according to some conditions
   * @param id id of the list item being processed
   * @param i index of the list item being processed
   */
  getCssClass(id: string, i: number) {
    let cssClass = '';
    if (id === this.pathId) { cssClass += 'highlight-div '; }
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

