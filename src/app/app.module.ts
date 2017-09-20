import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClarityModule } from 'clarity-angular';
import { SuiModule } from 'ng2-semantic-ui';

import { AppRoutingModule } from './app-routing.module';
import { RdfMappingModule } from './rdf-mapping/rdf-mapping.module';
import { TabularAnnotationModule } from './tabular-annotation/tabular-annotation.module';
import { TabularTransformationModule } from './tabular-transformation/tabular-transformation.module';

import { AppComponent } from './app.component';
import { PipelineComponent } from './pipeline/pipeline.component';
import { PipelineStepComponent } from './pipeline/pipeline-step.component';
import { PipelineFunctionFilterPipe } from './pipeline-function-filter.pipe';
import { MakeDatasetComponent } from './pipeline/make-dataset.component';
import { AddColumnsComponent } from './pipeline/add-columns.component';
import { FormsModule } from '@angular/forms';
import { RlTagInputModule } from 'angular2-tag-input';
import { AddRowComponent } from './pipeline/add-row.component';
import { DataExplorationComponent } from './data-exploration/data-exploration.component';


@NgModule({
  declarations: [
    AppComponent,
    PipelineComponent,
    PipelineStepComponent,
    PipelineFunctionFilterPipe,
    MakeDatasetComponent,
    AddColumnsComponent,
    AddRowComponent,
    DataExplorationComponent,

  ],
  imports: [
    BrowserModule,
    ClarityModule.forRoot(),
    TabularTransformationModule,
    RdfMappingModule,
    TabularAnnotationModule,
    AppRoutingModule,
    FormsModule,
    SuiModule,
    RlTagInputModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
