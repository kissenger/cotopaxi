import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-panel-routes-list-options',
  templateUrl: './panel-routes-list-options.component.html',
  styleUrls: ['./panel-routes-list-options.component.css']
})
export class PanelRoutesListOptionsComponent implements OnInit {

  constructor(
    private router: Router
  ) { }

  ngOnInit() {
  }

  /** virtually clicks the hidden form element to launch the select file dialogue */
  onLoadFileClick() {
    document.getElementById('file-select-single').click(); 
  }

  /** runs when file is selected */
  onFilePickedImport(event: Event, moreThanOneFile: boolean, pathType: string) {

    // Get multiple file names
    const files = (event.target as HTMLInputElement).files;        // multiple files
    document.documentElement.style.cursor = 'wait';

    const fileData = new FormData();
    fileData.append('filename', files[0], files[0].name);

    if ( pathType === 'route' ) {
      console.log(fileData);
      this.router.navigate(['routes/review']);
      // TODO pathType === 'track' not supported yet
      // this.httpService.importRoute(fileData).subscribe( (a: string) => {
      //   document.documentElement.style.cursor = 'default';
      //   this.dataService.storeNewPath(a.geoJson);
      //   this.router.navigate(['paths', this.pathType, '-1']);
      // });
    }



  }


}
