import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NglModule } from 'ng-lightning/ng-lightning';
import { NguiAutoCompleteModule } from '@ngui/auto-complete';
import { TabularAnnotationComponent } from './tabular-annotation.component';
import { AnnotationFormComponent } from './annotation-form/annotation-form.component';
import { ClarityModule } from '@clr/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
        MatDialogModule,
        MatExpansionModule,
        MatInputModule,
        MatTableModule,
        MatIconModule,
        MatSelectModule,
        MatFormFieldModule,
        MatCheckboxModule,
        MatSortModule,
        MatPaginatorModule,
        MatProgressSpinnerModule,
        MatAutocompleteModule,
        MatChipsModule
       } from '@angular/material';
import { ConfigComponent } from './config/config.component';
import { TagInputModule } from 'ngx-chips';
import { ReconciliationComponent } from './enrichment/reconciliation/reconciliation.component';
import { AddEntityDialog } from './enrichment/reconciliation/addEntityDialog.component';
import { ChooseExtensionOrReconciliationDialog} from './chooseExtensionOrReconciliationDialog.component';
import { ExtensionComponent } from './enrichment/extension/extension.component';
import {SharedModule} from './shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    NglModule.forRoot(),
    NguiAutoCompleteModule,
    ClarityModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MatDialogModule,
    TagInputModule,
    MatExpansionModule,
    MatTableModule,
    MatSelectModule,
    MatInputModule,
    MatIconModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatSortModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatAutocompleteModule,
    MatChipsModule,
    SharedModule
  ],
  entryComponents: [AnnotationFormComponent,
    ChooseExtensionOrReconciliationDialog,
    AddEntityDialog,
    ConfigComponent,
    ExtensionComponent,
    ReconciliationComponent],
  declarations: [
    TabularAnnotationComponent,
    AnnotationFormComponent,
    ConfigComponent,
    AddEntityDialog,
    ChooseExtensionOrReconciliationDialog,
    ReconciliationComponent,
    ExtensionComponent
  ]
})

export class TabularAnnotationModule { }
