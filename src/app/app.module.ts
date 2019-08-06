import {APP_INITIALIZER, ErrorHandler, NgModule} from '@angular/core';
import {AppConfig} from './app.config';
import {HttpModule} from '@angular/http';
import {HttpClientModule} from '@angular/common/http';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ClarityModule} from '@clr/angular';
import {SuiModule} from 'ng2-semantic-ui';
import {ListboxModule} from 'primeng/primeng';

import {AppRoutingModule} from './app-routing.module';
import {RdfMappingModule} from './rdf-mapping/rdf-mapping.module';
import {TabularAnnotationModule} from './tabular-annotation/tabular-annotation.module';
import {TabularTransformationModule} from './tabular-transformation/tabular-transformation.module';

import {AppComponent} from './app.component';
import {FormsModule} from '@angular/forms';
import {DataExplorationComponent} from './data-exploration/data-exploration.component';

import {TransformationService} from 'app/transformation.service';
import {AnnotationService} from './tabular-annotation/annotation.service';
import {RoutingService} from './routing.service';
import {JarfterService} from './jarfter.service';

import {GlobalErrorHandler} from 'app/global-error-handler';
import {GlobalErrorReportingService} from 'app/global-error-reporting.service';

import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {DataGraftMessageService} from 'app/data-graft-message.service';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {EnrichmentService} from './tabular-annotation/enrichment/enrichment.service';
import {ArangoGeneratorService} from 'app/arango-generator.service';
import {TransformationUpdaterService} from 'app/transformation-updater.service';
import {ProgressIndicatorService} from 'app/progress-indicator.service';
import {AsiaMasService} from './tabular-annotation/asia-mas/asia-mas.service';


export function initConfig(config: AppConfig) {
  return () => config.load();
}

@NgModule({
  declarations: [
    AppComponent,
    DataExplorationComponent,

  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    ClarityModule,
    TabularTransformationModule,
    RdfMappingModule,
    TabularAnnotationModule,
    AppRoutingModule,
    FormsModule,
    SuiModule,
    ListboxModule,
    HttpModule,
    HttpClientModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,

  ],
  providers: [
    AppConfig,
    GlobalErrorReportingService,
    TransformationService,
    AnnotationService,
    AsiaMasService,
    EnrichmentService,
    ArangoGeneratorService,
    TransformationUpdaterService,
    RoutingService,
    JarfterService,
    ProgressIndicatorService,
    {
      provide: APP_INITIALIZER,
      useFactory: initConfig,
      deps: [AppConfig],
      multi: true
    },
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler,
      deps: [GlobalErrorReportingService]
    },
    DataGraftMessageService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
