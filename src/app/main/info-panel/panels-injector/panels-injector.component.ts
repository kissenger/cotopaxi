import { Component, OnInit, ViewChild, ViewContainerRef, ComponentFactoryResolver, Input, ComponentRef } from '@angular/core';
import { DataService } from 'src/app/app-services/data.service'
import { InfoPanelService } from 'src/app/app-services/info-panel.service'

@Component({
  selector: 'app-panels-injector',
  templateUrl: './panels-injector.component.html',
  styleUrls: ['./panels-injector.component.css']
})
export class PanelsInjectorComponent implements OnInit {
  @ViewChild('AppInfoPanel', {static: true, read: ViewContainerRef}) infoPanel;
  @Input('panel-type') panelType: string;
  
  constructor(
    private factoryResolver: ComponentFactoryResolver,
    private dataService: DataService,
    private infoPanelService: InfoPanelService
  ) { }

  ngOnInit() {
    this.dataService.getPageName().then( pageName => {
      const component = this.infoPanelService.getComponent(pageName, this.panelType);
      this.loadPanel(component);
    })

  }

  
  ngAfterViewInit() {

  }
  

  /** 
   * Instantiates a component provided in c as a dynamic component in the view
   */
  loadPanel(c: any) {
    const factory = this.factoryResolver.resolveComponentFactory(c);  
    this.infoPanel.createComponent(factory);
  }
  
}
