import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

// Import components
import { RoutesCreateComponent } from './main/routes/routes-create/routes-create.component';
import { RoutesListComponent } from './main/routes/routes-list/routes-list.component';

const appRoutes: Routes = [
  { path: '', component: RoutesListComponent},
  { path: 'routes/list', component: RoutesListComponent},
  { path: 'routes/list/:id', component: RoutesListComponent},
  { path: 'routes/create', component: RoutesCreateComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(appRoutes)],
  exports: [RouterModule]
})

export class AppRoutingModule { }
