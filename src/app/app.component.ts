import { Component, Injector } from '@angular/core';
import { AlertService } from './shared/services/alert.service';
import { createCustomElement } from '@angular/elements';
import { AlertBoxComponent } from './shared/components/alert-box/alert-box.component';
import { SpinnerService } from './shared/services/spinner.service';
import { SpinnerComponent } from './shared/components/spinner/spinner.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'cotopaxi';

  constructor(
    injector: Injector,
    private alert: AlertService,
    private spinner: SpinnerService
  ) {
    //  // See angular custom elements example: https://angular.io/guide/elements

    const SpinnerElement = createCustomElement(SpinnerComponent, {injector});
    customElements.define('spinner-spinner', SpinnerElement);

    const AlertBoxElement = createCustomElement(AlertBoxComponent, {injector});
    customElements.define('alert-box', AlertBoxElement);

   
   }


}
