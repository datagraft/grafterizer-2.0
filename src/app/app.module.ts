import { APP_INITIALIZER } from '@angular/core';
import { AppConfig } from './app.config';
import { HttpModule } from '@angular/http';

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule, Routes } from '@angular/router';
import { ClarityModule } from 'clarity-angular';
import { SuiModule } from 'ng2-semantic-ui';

import { AppRoutingModule } from './app-routing.module';
import { RdfMappingModule } from './rdf-mapping/rdf-mapping.module';
import { TabularAnnotationModule } from './tabular-annotation/tabular-annotation.module';
import { TabularTransformationModule } from './tabular-transformation/tabular-transformation.module';

import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';
import { DataExplorationComponent } from './data-exploration/data-exploration.component';

export function initConfig(config: AppConfig) {
  return () => config.load();
}

@NgModule({
  declarations: [
    AppComponent,
    DataExplorationComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    ClarityModule.forRoot(),
    TabularTransformationModule,
    RdfMappingModule,
    TabularAnnotationModule,
    AppRoutingModule,
    FormsModule,
    SuiModule,
    HttpModule
  ],
  providers: [
    AppConfig,
    {
      provide: APP_INITIALIZER,
      useFactory: initConfig,
      deps: [AppConfig],
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
