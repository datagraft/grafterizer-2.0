import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { TabularTransformationComponent } from './tabular-transformation/tabular-transformation.component';
import { DataExplorationComponent } from './data-exploration/data-exploration.component';
import { TabularAnnotationComponent } from './tabular-annotation/tabular-annotation.component';
import { RdfMappingComponent } from './rdf-mapping/rdf-mapping.component';

const appRoutes: Routes = [
  { path: 'data-exploration', component: DataExplorationComponent },
  { path: 'tabular-annotation', component: TabularAnnotationComponent },
  { path: 'rdf-mapping', component: RdfMappingComponent },
  { path: 'tabular-transformation/new', component: TabularTransformationComponent },
  { path: 'tabular-transformation/:publisher/:transformationId', component: TabularTransformationComponent },
  { path: 'tabular-transformation/:publisher/:transformationId/preview/:filestoreId', component: TabularTransformationComponent },
  { path: '', redirectTo: '/tabular-transformation/new', pathMatch: 'full' },
  { path: '**', redirectTo: '/tabular-transformation/new', pathMatch: 'full' }
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