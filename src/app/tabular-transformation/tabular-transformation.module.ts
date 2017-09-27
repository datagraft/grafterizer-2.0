import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { FlexLayoutModule } from "@angular/flex-layout";
import { ClarityModule } from 'clarity-angular';
import { ListboxModule } from 'primeng/primeng';
import { RlTagInputModule } from 'angular2-tag-input';
import { SuiModule } from 'ng2-semantic-ui';
import { Ng2CompleterModule } from "ng2-completer";

import { TabularTransformationComponent } from "./tabular-transformation.component";
import { ProfilingComponent } from './profiling/profiling.component';
import { HandsontableComponent } from './handsontable/handsontable.component';
import { BoxplotComponent } from './profiling/boxplot/boxplot.component';
import { HistogramComponent } from './profiling/histogram/histogram.component';
import { LineChartComponent } from './profiling/line-chart/line-chart.component';
import { AdvPieChartComponent } from './profiling/adv-pie-chart/adv-pie-chart.component';
import { PieChartComponent } from './profiling/pie-chart/pie-chart.component';
import { StackedBarChartComponent } from './profiling/stacked-bar-chart/stacked-bar-chart.component';
import { StatisticTableComponent } from './profiling/statistic-table/statistic-table.component';
import { SelectboxComponent } from './sidebar/selectbox/selectbox.component';
import { MakeDatasetComponent } from './sidebar/pipeline-functions/make-dataset/make-dataset.component';
import { TakeRowsComponent } from './sidebar/pipeline-functions/take-rows/take-rows.component';
import { TakeColumnsComponent } from './sidebar/pipeline-functions/take-columns/take-columns.component';
import { SplitColumnsComponent } from './sidebar/pipeline-functions/split-columns/split-columns.component';
import { SortDatasetComponent } from './sidebar/pipeline-functions/sort-dataset/sort-dataset.component';
import { ShiftRowComponent } from './sidebar/pipeline-functions/shift-row/shift-row.component';
import { ShiftColumnComponent } from './sidebar/pipeline-functions/shift-column/shift-column.component';

import { TabularTransformationRoutingModule } from "./tabular-transformation-routing.module";
import { NglModule } from 'ng-lightning/ng-lightning';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,
    FormsModule,
    TabularTransformationRoutingModule,
    NglModule.forRoot(),
    FlexLayoutModule,
    ClarityModule,
    NgxChartsModule,
    NgxDatatableModule,
    ListboxModule,
    RlTagInputModule,
    SuiModule,
    Ng2CompleterModule
  ],
  declarations: [
    TabularTransformationComponent,
    ProfilingComponent,
    HandsontableComponent,
    BoxplotComponent,
    HistogramComponent,
    LineChartComponent,
    AdvPieChartComponent,
    PieChartComponent,
    StackedBarChartComponent,
    StatisticTableComponent,
    SelectboxComponent,
    MakeDatasetComponent,
    TakeRowsComponent,
    TakeColumnsComponent,
    SplitColumnsComponent,
    SortDatasetComponent,
    ShiftRowComponent,
    ShiftColumnComponent,
  ]
})

export class TabularTransformationModule { }
