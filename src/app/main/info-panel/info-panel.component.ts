import { Component, OnInit, Input } from '@angular/core';
import { InfoPanelService } from 'src/app/app-services/info-panel.service';
import { DataService } from 'src/app/app-services/data.service';

@Component({
  selector: 'app-info-panel',
  templateUrl: './info-panel.component.html',
  styleUrls: ['./info-panel.component.css']
})

export class InfoPanelComponent implements OnInit {

  private tabsArray: Array<{}>;

  constructor( 
    private infoPanelService: InfoPanelService,
    private dataService: DataService
   ) { }

  ngOnInit() {
    this.dataService.getPageName().then( pageName => {
      this.tabsArray = this.infoPanelService.getTabs(pageName);
    });
  }


}
