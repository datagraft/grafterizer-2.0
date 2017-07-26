import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TabularTransformationComponent } from "./tabular-transformation.component";

import { TabularTransformationRoutingModule } from "./tabular-transformation-routing.module";

@NgModule({
  imports: [
    CommonModule,
    TabularTransformationRoutingModule
  ],
  declarations: [
    TabularTransformationComponent
  ]
})

export class TabularTransformationModule { }
