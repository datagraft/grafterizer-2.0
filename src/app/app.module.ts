import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MdlModule } from "@angular-mdl/core";

import { AppRoutingModule } from './app-routing.module';
import { RdfMappingModule } from "./rdf-mapping/rdf-mapping.module";
import { TabularAnnotationModule } from "./tabular-annotation/tabular-annotation.module";
import { TabularTransformationModule } from "./tabular-transformation/tabular-transformation.module";

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    MdlModule,
    TabularTransformationModule,
    RdfMappingModule,
    TabularAnnotationModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
