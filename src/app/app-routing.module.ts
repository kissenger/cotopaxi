import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

// Import components
import { RoutesCreateComponent } from './main/routes/routes-create/routes-create.component';
import { RoutesListComponent } from './main/routes/routes-list/routes-list.component';
import { RoutesReviewComponent } from './main/routes/routes-review/routes-review.component';

const appRoutes: Routes = [
  { path: '', component: RoutesListComponent},
  { path: ':pathType/list', component: RoutesListComponent},
  { path: ':pathType/create', component: RoutesCreateComponent},
  { path: ':pathType/review', component: RoutesReviewComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(appRoutes)],
  exports: [RouterModule]
})

export class AppRoutingModule { }
