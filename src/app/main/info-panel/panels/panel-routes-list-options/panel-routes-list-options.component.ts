import { Component, OnInit, OnDestroy } from '@angular/core';
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
    
    const activePath = this.dataService.getFromStore('activePath', true).pathAsGeoJSON;
    console.log(activePath);
    this.httpService.deletePath(activePath.properties.pathId).subscribe( (response) => {

      // extra guff needed to refresh the page as we are wanting to refresh the current page rather than navigate away
      this.router.routeReuseStrategy.shouldReuseRoute = () => false;
      this.router.onSameUrlNavigation = 'reload';
      this.router.navigate(['route/list']);
      
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

    if ( pathType === 'route' ) {

      // send data to the backend and wait for response
      this.httpService.importRoute(fileData).subscribe( (result) => {

        const pathAsGeoJSON = result.geoJson;
        this.dataService.saveToStore('activePath', {source: 'imported', pathAsGeoJSON});
        this.router.navigate(['route/review/']);

      });
    }



  }


}
