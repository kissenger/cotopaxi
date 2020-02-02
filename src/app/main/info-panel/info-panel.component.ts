import { Component, OnInit, Input, ContentChildren, QueryList, ViewChildren, ViewContainerRef } from '@angular/core';
import { InfoPanelService } from 'src/app/shared/services/info-panel.service';
import { DataService } from 'src/app/shared/services/data.service';
import { PanelsInjectorComponent } from './panels-injector/panels-injector.component';

@Component({
  selector: 'app-info-panel',
  templateUrl: './info-panel.component.html',
  styleUrls: ['./info-panel.component.css']
})

export class InfoPanelComponent implements OnInit {
  // @ViewChildren("injector") divs: QueryList<any>;
  // @ViewChildren('injector', {read: ViewContainerRef}) viewContainerRefs: QueryList<any>;

  private tabsArray: Array<{}>;

  constructor( 
    private infoPanelService: InfoPanelService,
    private dataService: DataService
   ) { }

  //  ngAfterViewInit() {
  //   this.viewContainerRefs.changes.subscribe(item => {
  //     if(this.viewContainerRefs.toArray().length) {
  //       // shown
  //     }
  //   })
  //  }

  ngOnInit() {
    this.dataService.getPageName().then( pageName => {
      this.tabsArray = this.infoPanelService.getTabs(pageName);
    });
  }

  onClick(e) {
    this.dataService.activeTabEmitter.emit(e.target.id);
  }


}
