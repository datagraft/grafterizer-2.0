import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NglModule } from 'ng-lightning/ng-lightning';
import { Ng2CompleterModule } from "ng2-completer";
import { NguiAutoCompleteModule } from '@ngui/auto-complete';

import { TabularAnnotationComponent } from "./tabular-annotation.component";
import { TabularAnnotationDetailComponent } from "./tabular-annotation-detail.component";

import { TabularAnnotationRoutingModule } from "./tabular-annotation-routing.module";

@NgModule({
  imports: [
    CommonModule,
    TabularAnnotationRoutingModule,
    NglModule.forRoot(),
    Ng2CompleterModule,
    NguiAutoCompleteModule
  ],
  declarations: [
    TabularAnnotationComponent,
    TabularAnnotationDetailComponent
  ]
})

export class TabularAnnotationModule { }
