import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { ProfilingComponent } from './profiling/profiling.component';
import { HandsontableComponent } from './handsontable/handsontable.component';
import { PipelineComponent } from './sidebar/pipeline/pipeline.component'
import { RecommenderService } from './sidebar/recommender.service';
import { DispatchService } from '../dispatch.service';
import { TransformationService } from 'app/transformation.service';
import { RoutingService } from '../routing.service';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import * as transformationDataModel from 'assets/transformationdatamodel.js';
import * as generateClojure from 'assets/generateclojure.js';
import { Subscription } from 'rxjs/Subscription';
import { GlobalErrorReportingService } from 'app/global-error-reporting.service';

@Component({
  selector: 'app-tabular-transformation',
  templateUrl: './tabular-transformation.component.html',
  styleUrls: ['./tabular-transformation.component.css'],
  providers: [RecommenderService, DispatchService]
})

export class TabularTransformationComponent implements OnInit, OnDestroy {

  private function: any;
  private partialPipeline: any;
  private pipelineDefaultState: any;
  private recommendations: any;
  private handsontableSelection: any;
  private loadedDataHeaders: any

  // Local objects/ working memory initialized oninit - removed ondestroy, content transferred to observable ondestroy
  private transformationObj: any;
  private previewedTransformationObj: any;
  private graftwerkData: any;

  private dataSubscription: Subscription;

  private previewErrorSubscription: Subscription;
  private previewError: string;

  @ViewChild(HandsontableComponent) handsonTable: HandsontableComponent;
  @ViewChild(PipelineComponent) pipelineComponent: PipelineComponent;
  @ViewChild(ProfilingComponent) profilingComponent: ProfilingComponent;


  constructor(private recommenderService: RecommenderService, private dispatch: DispatchService,
    private transformationSvc: TransformationService, private routingService: RoutingService,
    private route: ActivatedRoute, private router: Router, private globalErrorSvc: GlobalErrorReportingService) {
    this.recommendations = [
      { label: 'Add columns', value: { id: 'AddColumnsFunction', defaultParams: null } },
      { label: 'Derive column', value: { id: 'DeriveColumnFunction', defaultParams: null } },
      { label: 'Shift column', value: { id: 'ShiftColumnFunction', defaultParams: null } },
      { label: 'Shift row', value: { id: 'ShiftRowFunction', defaultParams: null } },
      { label: 'Split column', value: { id: 'SplitFunction', defaultParams: null } },
      { label: 'Deduplicate', value: { id: 'RemoveDuplicatesFunction', defaultParams: null } },
      { label: 'Add row', value: { id: 'AddRowFunction', defaultParams: null } },
      { label: 'Make dataset', value: { id: 'MakeDatasetFunction', defaultParams: null } },
      { label: 'Reshape dataset', value: { id: 'MeltFunction', defaultParams: null } },
      { label: 'Sort dataset', value: { id: 'SortDatasetFunction', defaultParams: null } },
      { label: 'Take rows', value: { id: 'DropRowsFunction', defaultParams: null } },
      { label: 'Take columns', value: { id: 'ColumnsFunction', defaultParams: null } },
      { label: 'Custom function', value: { id: 'CustomFunctionDeclaration', defaultParams: null } }
    ];
    route.url.subscribe(() => this.routingService.concatURL(route));
  }

  ngOnInit() {
    this.dataSubscription = this.transformationSvc.currentGraftwerkData.subscribe(previewedData => {
      if (previewedData) {
        this.graftwerkData = previewedData;
        //        this.handsonTable.showLoading = true;
        //        this.handsonTable.displayJsEdnData(this.graftwerkData);
        this.profilingComponent.loadJSON(this.graftwerkData);
        this.profilingComponent.refresh(this.handsontableSelection);
        this.loadedDataHeaders = this.graftwerkData[':column-names'].map(o => o.substring(1, o.length));
      }
    });

    this.previewErrorSubscription = this.globalErrorSvc.previewErrorObs.subscribe((previewError) => {
      if (previewError) {
        this.previewError = previewError;
      } else {
        delete this.previewError;
      }

    });
  }

  ngOnDestroy() {
    this.dataSubscription.unsubscribe();
    this.previewErrorSubscription.unsubscribe();
  }

  tableSelectionChanged(newSelection: any) {
    this.handsontableSelection = newSelection;
    this.profilingComponent.refresh(newSelection);
    const ind = this.handsonTable.hot.getSelected();
    const data = [];
    const headers = [];
    for (let i = ind[0]; i <= ind[2]; ++i) {
      const row = [];
      for (let j = ind[1]; j <= ind[3]; ++j) {
        row.push(this.handsonTable.hot.getDataAtCell(i, j));
      }
      data.push(row);
    }
    for (let j = ind[1]; j <= ind[3]; ++j) {
      headers.push(this.handsonTable.hot.getColHeader(j));
    }
    const recommend = this.recommenderService.getRecommendationWithParams(
      newSelection.row, newSelection.col, newSelection.row2, newSelection.col2,
      newSelection.totalRows, newSelection.totalCols, data, headers);
    this.recommendations = recommend;
  }

}
