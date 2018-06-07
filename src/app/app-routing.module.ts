import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { TabularTransformationComponent } from './tabular-transformation/tabular-transformation.component';
import { DataExplorationComponent } from './data-exploration/data-exploration.component';
import { TabularAnnotationComponent } from './tabular-annotation/tabular-annotation.component';
import { RdfMappingComponent } from './rdf-mapping/rdf-mapping.component';

const appRoutes: Routes = [
  { path: 'transformations/new/tabular-transformation', component: TabularTransformationComponent },
  { path: ':publisher/transformations/new/tabular-transformation', component: TabularTransformationComponent },
  { path: ':publisher/transformations/:transformationId/tabular-transformation', component: TabularTransformationComponent },
  { path: ':publisher/transformations/:transformationId/rdf-mapping', component: RdfMappingComponent },
  { path: ':publisher/transformations/:transformationId/:filestoreId/tabular-transformation', component: TabularTransformationComponent },
  { path: ':publisher/transformations/:transformationId/:filestoreId/rdf-mapping', component: RdfMappingComponent },
  { path: ':publisher/transformations/:transformationId/:filestoreId/tabular-annotation', component: TabularAnnotationComponent },
  { path: ':publisher/transformations/:transformationId', redirectTo: ':publisher/transformations/:transformationId/tabular-transformation', pathMatch: 'full' },
  { path: '', redirectTo: ':publisher/transformations/:transformationId', pathMatch: 'full' },
  { path: '**', redirectTo: ':publisher/transformations/:transformationId', pathMatch: 'full' }
];

@NgModule({
  imports: [
    RouterModule.forRoot(
      appRoutes,
      { /*enableTracing: true*/ } // <-- debugging purposes only
    )
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule { }
