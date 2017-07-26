import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { TabularTransformationComponent } from "./tabular-transformation.component";

const tabTransformationRoutes: Routes = [
  { path: 'tabular-transformation', component: TabularTransformationComponent }
];

@NgModule({
  imports: [
    RouterModule.forChild(tabTransformationRoutes)
  ],
  exports: [
    RouterModule
  ]
})
export class TabularTransformationRoutingModule { }