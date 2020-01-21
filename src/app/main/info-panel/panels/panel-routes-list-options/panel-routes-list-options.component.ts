import { Component, OnInit, OnDestroy } from '@angular/core';
import * as globals from 'src/app/shared/globals';
import { Router } from '@angular/router';
import { HttpService } from 'src/app/shared/services/http.service';
import { DataService } from 'src/app/shared/services/data.service';
import { MapService } from 'src/app/shared/services/map.service';

@Component({
  selector: 'app-panel-routes-list-options',
  templateUrl: './panel-routes-list-options.component.html',
  styleUrls: ['./panel-routes-list-options.component.css']
})
export class PanelRoutesListOptionsComponent implements OnInit {

  constructor(
    private router: Router,
    private httpService: HttpService,
    private dataService: DataService,
    private mapService: MapService
  ) { }

  ngOnInit() {
  }

  /** virtually clicks the hidden form element to launch the select file dialogue */
  onLoadFileClick() {
    document.getElementById('file-select-single').click(); 
  }

  onDeleteClick() {
    
    const activePath = this.dataService.getFromStore('activePath', false).pathAsGeoJSON;
    const confirmText = "Are you sure you want to delete this route?\nThis cannot be undone..."
    if ( window.confirm(confirmText) ) {
      this.httpService.deletePath(activePath.properties.pathId).subscribe( (response) => {
        this.reloadListComponent();
      });
    };
  }


  onExportGpxClick(){
    const pathId = this.dataService.getFromStore('activePath', false).pathAsGeoJSON.properties.pathId;
    const pathType = 'route';
    this.httpService.exportToGpx(pathType, pathId).subscribe( (fname) => {
      // window.location.href = this.httpService.downloadFile(fname.fileName);
      window.location.href = 'http://localhost:3000/download/' + fname.fileName;
    });
  }


  onCreateOnMapClick() {
    
    this.router.navigate(['/route/create']);
  }

  /** runs when file is selected */
  onFilePickedImport(event: Event, moreThanOneFile: boolean, pathType: string) {

    // Get file names
    const files = (event.target as HTMLInputElement).files;        // multiple files
    const fileData = new FormData();
    fileData.append('filename', files[0], files[0].name);

    if (files[0].size > globals.EXPORT_FILE_SIZE_LIMIT) {
      const confirmText = 
        'That\'s a big file, it\'ll take a while to process :-)\n' +
        'It\'ll get processed in the background and  will appear in your routes list when ready.'

      if ( window.confirm(confirmText) ) {
        // if the file is too large, we will only expect a brief immediate response from the backend - add field to back knows what we expect
        fileData.append('isLarge', 'true');
        this.httpService.importRoute(fileData).subscribe( (result) => {

          console.log(result);
          this.reloadListComponent();

        });
      } else {
        // user pressed cancel, find a way to navigate back with all links still working
        this.reloadListComponent();
      }
    } else {
      fileData.append('isLarge', 'false');
      this.httpService.importRoute(fileData).subscribe( (result) => {
        console.log(result.geoJson);
        const pathAsGeoJSON = result.geoJson;
        this.dataService.saveToStore('activePath', {source: 'imported', pathAsGeoJSON});
        this.router.navigate(['route/review/']);

      });
    }

    // if ( pathType === 'route' ) {

    //   // send data to the backend and wait for response
    //   this.httpService.importRoute(fileData).subscribe( (result) => {

    //     console.log(result.geoJson);
    //     const pathAsGeoJSON = result.geoJson;
    //     this.dataService.saveToStore('activePath', {source: 'imported', pathAsGeoJSON});
    //     this.router.navigate(['route/review/']);

    //   });
    // }



  }

  reloadListComponent() {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.router.onSameUrlNavigation = 'reload';
    this.router.navigate(['route/list']);
  }


}
