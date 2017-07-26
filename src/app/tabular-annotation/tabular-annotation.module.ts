import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TabularAnnotationComponent } from "./tabular-annotation.component";
import { TabularAnnotationDetailComponent } from "./tabular-annotation-detail.component";

import { TabularAnnotationRoutingModule } from "./tabular-annotation-routing.module";

@NgModule({
  imports: [
    CommonModule,
    TabularAnnotationRoutingModule
  ],
  declarations: [
    TabularAnnotationComponent,
    TabularAnnotationDetailComponent
  ]
})

export class TabularAnnotationModule { }
