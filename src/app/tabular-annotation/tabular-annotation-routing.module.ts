import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { TabularAnnotationComponent } from "./tabular-annotation.component";
import { TabularAnnotationDetailComponent } from "./tabular-annotation-detail.component";

const tabAnnotationRoutes: Routes = [
  { path: 'tabular-annotation', component: TabularAnnotationComponent,
      children: [
      {
        path: 'detail',
        component: TabularAnnotationDetailComponent
      }
      ]
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(tabAnnotationRoutes)
  ],
  exports: [
    RouterModule
  ]
})
export class TabularAnnotationRoutingModule { }