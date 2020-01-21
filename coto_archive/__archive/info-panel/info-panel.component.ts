import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-info-panel',
  templateUrl: './info-panel.component.html',
  styleUrls: ['./info-panel.component.css']
})

/**
 * This component displays the info panel on the right
 * It works by determining the page type from the url and using *ngIfs to
 * turn on html elements accordingly 
 */

export class InfoPanelComponent implements OnInit {

  private page;
  private timer;
  private isListPage: boolean = false;
  private isCreatePage: boolean = false;

  constructor(
    private router: Router
  ) {}

  ngOnInit() {


    
    // determine what type of page we need so we can adjust the view accordingly
    this.timer = setInterval( () => {
      if (this.router.url !== '/') { 
        this.page = this.router.url.split('/')[2];
        if (this.page === 'list') { this.isListPage = true; }
        if (this.page === 'create') { this.isCreatePage = true; }
        clearInterval(this.timer); 
      } 
    }, 1);

  }




}
