//Modules
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
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
import { SpinnerComponent } from './shared/components/spinner/spinner.component';
import { AlertBoxComponent } from './shared/components/alert-box/alert-box.component';
import { RoutesReviewComponent } from './main/routes/routes-review/routes-review.component';

//Services
import { HttpService } from './shared/services/http.service';
import { MapService } from './shared/services/map.service';
import { MapCreateService } from './shared/services/map-create.service';
import { AlertService } from './shared/services/alert.service';
import { SpinnerService } from './shared/services/spinner.service';

//Pipes
import { UnitPipe } from './shared/unit.pipe';

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
    RoutesReviewComponent,
    SpinnerComponent,
    AlertBoxComponent
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
    MapCreateService,
    AlertService,
    SpinnerService
  ],
  bootstrap: [AppComponent],
  entryComponents: [
    PanelRoutesCreateDetailsComponent, 
    PanelRoutesCreateOverlayComponent,
    PanelRoutesListListComponent,
    PanelRoutesListDetailsComponent,
    PanelRoutesListOptionsComponent,
    AlertBoxComponent,
    SpinnerComponent
    ]
})
export class AppModule { }
