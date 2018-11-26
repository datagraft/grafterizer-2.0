import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NglModule } from 'ng-lightning/ng-lightning';
import { NguiAutoCompleteModule } from '@ngui/auto-complete';

import { TabularAnnotationComponent } from './tabular-annotation.component';
import { TabularAnnotationDetailComponent } from './tabular-annotation-detail.component';

import { TabularAnnotationRoutingModule } from './tabular-annotation-routing.module';
import { AnnotationFormComponent } from './annotation-form/annotation-form.component';
import { ClarityModule } from '@clr/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule } from '@angular/material';
import { ConfigComponent } from './config/config.component';
import { TagInputModule } from 'ngx-chips';
import { ReconciliationComponent } from './enrichment/reconciliation/reconciliation.component';
import { ExtensionComponent } from './enrichment/extension/extension.component';

@NgModule({
  imports: [
    CommonModule,
    TabularAnnotationRoutingModule,
    NglModule.forRoot(),
    NguiAutoCompleteModule,
    ClarityModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MatDialogModule,
    TagInputModule
  ],
  entryComponents: [AnnotationFormComponent, ConfigComponent, ExtensionComponent, ReconciliationComponent],
  declarations: [
    TabularAnnotationComponent,
    TabularAnnotationDetailComponent,
    AnnotationFormComponent,
    ConfigComponent,
    ReconciliationComponent,
    ExtensionComponent
  ]
})

export class TabularAnnotationModule { }
