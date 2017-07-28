import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TabularTransformationComponent } from "./tabular-transformation.component";

import { TabularTransformationRoutingModule } from "./tabular-transformation-routing.module";
import { ProfilingComponent } from './profiling/profiling.component';

@NgModule({
  imports: [
    CommonModule,
    TabularTransformationRoutingModule
  ],
  declarations: [
    TabularTransformationComponent,
    ProfilingComponent
  ]
})

export class TabularTransformationModule { }
