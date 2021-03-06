import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {NglModule} from 'ng-lightning/ng-lightning';
import {NguiAutoCompleteModule} from '@ngui/auto-complete';
import {TabularAnnotationComponent} from './tabular-annotation.component';
import {AnnotationFormComponent} from './annotation-form/annotation-form.component';
import {ClarityModule} from '@clr/angular';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {
  MatAutocompleteModule,
  MatButtonModule,
  MatCheckboxModule,
  MatChipsModule,
  MatDialogModule,
  MatExpansionModule,
  MatFormFieldModule,
  MatIconModule,
  MatInputModule,
  MatPaginatorModule,
  MatProgressSpinnerModule,
  MatSelectModule,
  MatSortModule,
  MatTableModule
} from '@angular/material';
import {ConfigComponent} from './config/config.component';
import {TagInputModule} from 'ngx-chips';
import {ReconciliationComponent} from './enrichment/reconciliation/reconciliation.component';
import {AddEntityDialogComponent} from './enrichment/reconciliation/addEntityDialog.component';
import {ChooseExtensionOrReconciliationDialog} from './chooseExtensionOrReconciliationDialog.component';
import {ExtensionComponent} from './enrichment/extension/extension.component';
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
    MatButtonModule,
    SharedModule
  ],
  entryComponents: [AnnotationFormComponent,
    ChooseExtensionOrReconciliationDialog,
    AddEntityDialogComponent,
    ConfigComponent,
    ExtensionComponent,
    ReconciliationComponent],
  declarations: [
    TabularAnnotationComponent,
    AnnotationFormComponent,
    ConfigComponent,
    AddEntityDialogComponent,
    ChooseExtensionOrReconciliationDialog,
    ReconciliationComponent,
    ExtensionComponent
  ]
})

export class TabularAnnotationModule { }
