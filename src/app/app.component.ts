import { Component, Injector, OnInit } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { AlertBoxComponent } from 'src/app/shared/components/alert-box/alert-box.component';
import { SpinnerComponent } from 'src/app/shared/components/spinner/spinner.component';
import { LoginComponent } from 'src/app/shared/components/login/login.component';
import { RegisterComponent } from 'src/app/shared/components/register/register.component';
import { ProfileComponent } from './shared/components/profile/profile.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'cotopaxi';

  constructor(
    injector: Injector
  ) {

    //  // See angular custom elements example: https://angular.io/guide/elements

    const SpinnerElement = createCustomElement(SpinnerComponent, {injector});
    customElements.define('bootstrap-spinner', SpinnerElement);

    const AlertBoxElement = createCustomElement(AlertBoxComponent, {injector});
    customElements.define('alert-box', AlertBoxElement);

    const LoginElement = createCustomElement(LoginComponent, {injector});
    customElements.define('login-box', LoginElement);

    const RegisterElement = createCustomElement(RegisterComponent, {injector});
    customElements.define('register-box', RegisterElement);

    const ProfileElement = createCustomElement(ProfileComponent, {injector});
    customElements.define('profile-box', ProfileElement);

   }

   ngOnInit() {
     const pleadString =
     '\n\n<promote-self>\n' +
     'Looking for a full-stack developer with ' +
     'Angular2+, NodeJS, Express, Mongo, Google Maps API ' +
     'Mapbox API experience, and driven to develop projects ' +
     'like this in his spare time?  \n' +
     'Visit www.kissenger-codes.co.uk for portfolio and contact ' +
     'details\n' +
      '</promote-self>\n\n';

     console.log('%c' + pleadString, 'background: #FFFFFF; color: #bada55');
  }


}
