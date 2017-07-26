import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { RdfMappingComponent } from "./rdf-mapping.component";

const rdfRoutes: Routes = [
  { path: 'rdf-mapping', component: RdfMappingComponent }
];

@NgModule({
  imports: [
    RouterModule.forChild(rdfRoutes)
  ],
  exports: [
    RouterModule
  ]
})
export class RdfMappingRoutingModule { }