import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RdfMappingComponent } from "./rdf-mapping.component";

import { RdfMappingRoutingModule } from "./rdf-mapping-routing.module";

@NgModule({
  imports: [
    CommonModule,
    RdfMappingRoutingModule
  ],
  declarations: [
    RdfMappingComponent
  ]
})

export class RdfMappingModule { }
