import { Component, OnInit, OnDestroy, DoCheck, ViewChild, AfterViewInit } from '@angular/core';
import { ProfilingComponent } from './profiling/profiling.component';
import { HandsontableComponent } from './handsontable/handsontable.component';
import { PipelineComponent } from './sidebar/pipeline/pipeline.component'
import { RecommenderService } from './sidebar/recommender.service';
import { DispatchService } from '../dispatch.service';
import { TransformationService } from 'app/transformation.service';
import { RoutingService } from '../routing.service';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { GlobalErrorReportingService } from 'app/global-error-reporting.service';
import { DataGraftMessageService } from '../data-graft-message.service';

@Component({
  selector: 'app-tabular-transformation',
  templateUrl: './tabular-transformation.component.html',
  styleUrls: ['./tabular-transformation.component.css'],
  providers: [RecommenderService, DispatchService]
})

export class TabularTransformationComponent implements OnInit, OnDestroy, DoCheck {

  private function: any;
  private partialPipeline: any;
  private pipelineDefaultState: any;
  private recommendations: any;
  private handsontableSelection: any;
  private loadedDataHeaders: any

  private showSelectbox: boolean = false;
  private showPipelineMetadataTabs: boolean = true;
  private showHandsonTableProfiling: boolean = true;
  private showHandsontable: boolean = true;
  private showProfiling: boolean = true;
  private showPipelineOnly: boolean = false;

  private metadata: any;
  private title: string;
  private description: string;
  private keywords: string[];
  private isPublic: boolean = false;

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
    private route: ActivatedRoute, private router: Router, private globalErrorSvc: GlobalErrorReportingService, public messageSvc: DataGraftMessageService) {
    this.recommendations = [
      { label: 'Add columns', value: { id: 'AddColumnsFunction', defaultParams: null } },
      { label: 'Derive column', value: { id: 'DeriveColumnFunction', defaultParams: null } },
      { label: 'Shift column', value: { id: 'ShiftColumnFunction', defaultParams: null } },
      { label: 'Shift row', value: { id: 'ShiftRowFunction', defaultParams: null } },
      { label: 'Split column', value: { id: 'SplitFunction', defaultParams: null } },
      { label: 'Merge columns', value: { id: 'MergeColumnsFunction', defaultParams: null } },
      { label: 'Map columns', value: { id: 'MapcFunction', defaultParams: null } },
      // { label: 'Deduplicate', value: { id: 'RemoveDuplicatesFunction', defaultParams: null } },
      // { label: 'Add row', value: { id: 'AddRowFunction', defaultParams: null } },
      { label: 'Make dataset', value: { id: 'MakeDatasetFunction', defaultParams: null } },
      { label: 'Reshape dataset', value: { id: 'MeltFunction', defaultParams: null } },
      { label: 'Sort dataset', value: { id: 'SortDatasetFunction', defaultParams: null } },
      { label: 'Take rows', value: { id: 'DropRowsFunction', defaultParams: null } },
      { label: 'Take columns', value: { id: 'ColumnsFunction', defaultParams: null } }
    ];
    route.url.subscribe((result) => {
      this.routingService.concatURL(route);
    });
  }

  ngOnInit() {
    this.dataSubscription = this.transformationSvc.currentGraftwerkData.subscribe(previewedData => {
      if (previewedData) {
        this.graftwerkData = previewedData;
        if (this.profilingComponent !== undefined) {
          this.profilingComponent.loadJSON(this.graftwerkData);
          this.profilingComponent.refresh(this.handsontableSelection);
        }
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

    const paramMap = this.route.snapshot.paramMap;
    if (paramMap.has('publisher') && paramMap.has('transformationId')) {
      if (!paramMap.has('filestoreId')) {
        this.showPipelineOnly = false;
        this.showHandsonTableProfiling = false;
        if (this.messageSvc.getCurrentDataGraftMessageState() == 'transformations.transformation' || document.referrer.includes('/new/')) {
          this.showPipelineOnly = false;
          this.showHandsonTableProfiling = false;
        }
        else if (this.messageSvc.getCurrentDataGraftMessageState() == 'transformations.readonly' || this.messageSvc.getCurrentDataGraftMessageState() == undefined) {
          this.showPipelineOnly = true;
          this.showHandsonTableProfiling = false;
        }
      }
      this.dispatch.getTransformation(paramMap.get('publisher'), paramMap.get('transformationId'))
        .then(
          (result) => {
            this.transformationSvc.changeTransformationMetadata(result);
            this.transformationSvc.currentTransformationMetadata.subscribe((metadata) => this.metadata = metadata);
            this.title = result.title;
            this.description = result.description;
            this.keywords = result.keywords;
            this.isPublic = result.public;
          },
          (error) => {
            console.log(error);
          });
    }
    else if (paramMap.has('publisher') && !paramMap.has('transformationId')) {
      this.showHandsonTableProfiling = false;
    }
    else if (!paramMap.has('publisher')) {
      this.showPipelineOnly = true;
    }
  }

  ngOnDestroy() {
    this.dataSubscription.unsubscribe();
    this.previewErrorSubscription.unsubscribe();
  }

  ngDoCheck() {
    if (this.metadata !== undefined) {
      if (this.title !== this.metadata.title) {
        this.metadata.title = this.title;
        this.transformationSvc.changeTransformationMetadata(this.metadata);
      }
      else if (this.description !== this.metadata.description) {
        this.metadata.description = this.description;
        this.transformationSvc.changeTransformationMetadata(this.metadata);
      }
      else if (this.keywords !== this.metadata.keywords) {
        this.metadata.keywords = this.keywords;
        this.transformationSvc.changeTransformationMetadata(this.metadata);
      }
      else if (this.isPublic !== this.metadata.isPublic) {
        this.metadata.isPublic = this.isPublic;
        this.transformationSvc.changeTransformationMetadata(this.metadata);
      }
    }
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
