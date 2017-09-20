import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DataExplorationComponent } from "./data-exploration.component";

import { DataExplorationRoutingModule } from "./data-exploration-routing.module";

@NgModule({
  imports: [
    CommonModule,
    DataExplorationRoutingModule
  ],
  declarations: [
    DataExplorationComponent
  ]
})

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: []
})
export class DataExplorationModule { }
