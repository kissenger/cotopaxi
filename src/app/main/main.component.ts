import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpService } from '../shared/services/http.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit, OnDestroy {

  private paramSubs: any;
  private id: string;
  private timer;
  private page: string;

  constructor(
    private activatedRouter: ActivatedRoute,
    private httpService: HttpService,
    private router: Router
  ) { }

  ngOnInit() {

    // gets the url - delay needed to ensure page has loaded - not neat but can't find a better way
    this.timer = setInterval( () => {
      if (this.router.url !== '/') { 
        this.page = this.router.url.split('/')[2];
        clearInterval(this.timer); 
      } 
    }, 1);

  }

  ngAfterViewInit() {
    // console.log(this.router.url);
    // console.log(window.location.href);

  }

  ngOnDestroy() {
    clearInterval(this.timer);
  }
}
