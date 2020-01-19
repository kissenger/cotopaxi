
/**
 * This directive works with the info-panel component(s) to dynamically load the appropriate
 * info-panel content, depending on the requested page - this helps to simplify the code structure
 * https://angular.io/guide/dynamic-component-loader
 * https://stackoverflow.com/questions/49653507/angular-create-selector-tag-app-component-using-variable-or-loop
 */

import { Directive, ViewContainerRef, Input } from '@angular/core';

@Directive({
  selector: '[app-info-panel-directive]'
})
export class InfoPanelDirective {
  @Input() panelType: string;

  constructor(
    public viewContainerRef: ViewContainerRef
  ) { }

  ngOnInit() {
    console.log(this.panelType);
  }
}
