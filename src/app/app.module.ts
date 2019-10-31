//Modules
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

//Components
import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';
import { RoutesCreateComponent } from './main/routes/routes-create/routes-create.component';
import { RoutesListComponent } from './main/routes/routes-list/routes-list.component';
import { FooterComponent } from './footer/footer.component';
import { MainComponent } from './main/main.component';
import { InfoPanelComponent } from './main/info-panel/info-panel.component';
import { MenuBarComponent } from './main/menu-bar/menu-bar.component';

import { PanelsInjectorComponent } from './main/info-panel/panels-injector/panels-injector.component';
import { PanelRoutesCreateDetailsComponent } from './main/info-panel/panels/panel-routes-create-details/panel-routes-create-details.component';
import { PanelRoutesCreateOverlayComponent } from './main/info-panel/panels/panel-routes-create-overlay/panel-routes-create-overlay.component';
import { PanelRoutesListListComponent } from './main/info-panel/panels/panel-routes-list-list/panel-routes-list-list.component';
import { PanelRoutesListDetailsComponent } from './main/info-panel/panels/panel-routes-list-details/panel-routes-list-details.component';
import { PanelRoutesListOptionsComponent } from './main/info-panel/panels/panel-routes-list-options/panel-routes-list-options.component';

//Services
import { HttpService } from './app-services/http.service';
import { MapService } from './app-services/map.service';
import { MapCreateService } from './app-services/map-create.service';

//Pipes
import { UnitPipe } from './app-pipes/unit.pipe';
import { RoutesReviewComponent } from './main/routes/routes-review/routes-review.component';


//Directives
// import { InfoPanelDirective } from './__archive/app-directives/info-panel.directive';


@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    RoutesCreateComponent,
    RoutesListComponent,
    FooterComponent,
    MainComponent,
    InfoPanelComponent,
    MenuBarComponent,
    UnitPipe,
    // InfoPanelDirective,
    PanelsInjectorComponent,
    PanelRoutesCreateDetailsComponent,
    PanelRoutesCreateOverlayComponent,
    PanelRoutesListListComponent,
    PanelRoutesListDetailsComponent,
    PanelRoutesListOptionsComponent,
    RoutesReviewComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [
    HttpService,
    MapService,
    MapCreateService
  ],
  bootstrap: [AppComponent],
  entryComponents: [
    PanelRoutesCreateDetailsComponent, 
    PanelRoutesCreateOverlayComponent,
    PanelRoutesListListComponent,
    PanelRoutesListDetailsComponent,
    PanelRoutesListOptionsComponent
    ]
})
export class AppModule { }
