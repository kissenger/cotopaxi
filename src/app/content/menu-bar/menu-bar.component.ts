import { Component, OnInit } from '@angular/core';
import { DataService } from 'src/app/data.service';

@Component({
  selector: 'app-menu-bar',
  templateUrl: './menu-bar.component.html',
  styleUrls: ['./menu-bar.component.css']
})
export class MenuBarComponent implements OnInit {

  constructor(
    private dataService: DataService
  ) { }

  ngOnInit() {

  }

  onClick(clickItem) {
    console.log(clickItem);
    this.dataService.menuClick.emit(clickItem);
  }
}
