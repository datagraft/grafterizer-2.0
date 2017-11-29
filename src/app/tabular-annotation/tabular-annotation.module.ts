import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {NglModule} from 'ng-lightning/ng-lightning';
import {Ng2CompleterModule} from 'ng2-completer';
import {NguiAutoCompleteModule} from '@ngui/auto-complete';

import {TabularAnnotationComponent} from './tabular-annotation.component';
import {TabularAnnotationDetailComponent} from './tabular-annotation-detail.component';

import {TabularAnnotationRoutingModule} from './tabular-annotation-routing.module';
import {AnnotationFormComponent} from './annotation-form/annotation-form.component';
import {ClarityModule} from 'clarity-angular';
import {FormsModule} from '@angular/forms';
import {RlTagInputModule} from 'angular2-tag-input/dist';

@NgModule({
  imports: [
    CommonModule,
    TabularAnnotationRoutingModule,
    NglModule.forRoot(),
    Ng2CompleterModule,
    NguiAutoCompleteModule,
    ClarityModule,
    FormsModule,
    RlTagInputModule
  ],
  declarations: [
    TabularAnnotationComponent,
    TabularAnnotationDetailComponent,
    AnnotationFormComponent
  ]
})

export class TabularAnnotationModule { }
