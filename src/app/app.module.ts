import { APP_INITIALIZER, NgModule } from '@angular/core';
import { AppConfig } from './app.config';
import { HttpModule } from '@angular/http';
import { HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ClarityModule } from 'clarity-angular';
import { SuiModule } from 'ng2-semantic-ui';

import { AppRoutingModule } from './app-routing.module';
import { RdfMappingModule } from './rdf-mapping/rdf-mapping.module';
import { TabularAnnotationModule } from './tabular-annotation/tabular-annotation.module';
import { TabularTransformationModule } from './tabular-transformation/tabular-transformation.module';

import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';
import { DataExplorationComponent } from './data-exploration/data-exploration.component';
import { AngularSplitModule } from 'angular-split';

import { TransformationService } from 'app/transformation.service';
import { AnnotationService } from './tabular-annotation/annotation.service';
import { RoutingService } from './routing.service';

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
    HttpModule,
    HttpClientModule,
    AngularSplitModule
  ],
  providers: [
    AppConfig,
    TransformationService,
    AnnotationService,
    RoutingService,
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
