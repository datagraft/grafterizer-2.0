import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { FlexLayoutModule } from "@angular/flex-layout";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';


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

import { TabularTransformationRoutingModule } from "./tabular-transformation-routing.module";
import { NglModule } from 'ng-lightning/ng-lightning';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { MakeDatasetComponent } from './make-dataset/make-dataset.component';

@NgModule({
  imports: [
    CommonModule,
    TabularTransformationRoutingModule,
    NglModule.forRoot(),
    BrowserModule,
    FlexLayoutModule,
    NgxChartsModule,
    BrowserAnimationsModule,
    NgxDatatableModule
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
    MakeDatasetComponent
  ]
})

export class TabularTransformationModule { }
