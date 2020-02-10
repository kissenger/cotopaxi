import { Injectable } from '@angular/core';
import { NgElement, WithProperties } from '@angular/elements';
import { SpinnerComponent } from 'src/app/shared/components/spinner/spinner.component';

/**
 * Service to launch custom spinner element 
 * See angular custom elements example: https://angular.io/guide/elements
 */

@Injectable({
  providedIn: 'root'
})
export class SpinnerService {

  private spinner: NgElement & WithProperties<SpinnerComponent>;
  constructor() { }

  removeElement() {
    document.body.removeChild(this.spinner);
  }

  showAsElement() {

    // Create element    
    // const spinner: NgElement & WithProperties<SpinnerComponent> = document.createElement('spinner-spinner') as any;
    this.spinner = document.createElement('bootstrap-spinner') as any;

    // Add to the DOM
    document.body.appendChild(this.spinner);

  }
}