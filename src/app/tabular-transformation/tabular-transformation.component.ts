import { Component, OnInit, OnDestroy, DoCheck, ViewChild, AfterViewInit } from '@angular/core';
import { ProfilingComponent } from './profiling/profiling.component';
import { HandsontableComponent } from './handsontable/handsontable.component';
import { PipelineComponent } from './sidebar/pipeline/pipeline.component'
import { RecommenderService } from './sidebar/recommender.service';
import { DispatchService } from '../dispatch.service';
import { TransformationService } from 'app/transformation.service';
import { RoutingService } from '../routing.service';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Subscription } from 'rxjs';
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
  showPipelineOnly: boolean = false;

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

  private currentDataGraftStateSubscription: Subscription;
  private currentDataGraftState: string;

  @ViewChild(HandsontableComponent) handsonTable: HandsontableComponent;
  @ViewChild(PipelineComponent) pipelineComponent: PipelineComponent;
  @ViewChild(ProfilingComponent) profilingComponent: ProfilingComponent;

  constructor(private recommenderService: RecommenderService, private dispatch: DispatchService,
    private transformationSvc: TransformationService, private routingService: RoutingService,
    private route: ActivatedRoute, private router: Router, private globalErrorSvc: GlobalErrorReportingService, public messageSvc: DataGraftMessageService) {
    this.recommendations = [
      { label: 'Make dataset', value: { id: 'MakeDatasetFunction', defaultParams: null } },
      { label: 'Group and aggregate', value: { id: 'GroupRowsFunction', defaultParams: null } },
      { label: 'Reshape dataset', value: { id: 'MeltFunction', defaultParams: null } },
      { label: 'Sort dataset', value: { id: 'SortDatasetFunction', defaultParams: null } },
      { label: 'Derive column', value: { id: 'DeriveColumnFunction', defaultParams: null } },
      { label: 'Map columns', value: { id: 'MapcFunction', defaultParams: null } },
      { label: 'Add columns', value: { id: 'AddColumnsFunction', defaultParams: null } },
      { label: 'Take columns', value: { id: 'ColumnsFunction', defaultParams: null } },
      { label: 'Shift column', value: { id: 'ShiftColumnFunction', defaultParams: null } },
      { label: 'Merge columns', value: { id: 'MergeColumnsFunction', defaultParams: null } },
      { label: 'Split column', value: { id: 'SplitFunction', defaultParams: null } },
      { label: 'Rename columns', value: { id: 'RenameColumnsFunction', defaultParams: null } },
      { label: 'Add rows', value: { id: 'AddRowFunction', defaultParams: null } },
      { label: 'Shift row', value: { id: 'ShiftRowFunction', defaultParams: null } },
      { label: 'Take rows', value: { id: 'DropRowsFunction', defaultParams: null } },
      { label: 'Filter rows', value: { id: 'GrepFunction', defaultParams: null } },
      { label: 'Deduplicate', value: { id: 'RemoveDuplicatesFunction', defaultParams: null } },
      { label: 'Utility function', value: { id: 'UtilityFunction', defaultParams: null } }
    ];
    route.url.subscribe((result) => {
      this.routingService.concatURL(route);
    });
  }

  ngOnInit() {
    this.dataSubscription = this.transformationSvc.graftwerkDataSource.subscribe(previewedData => {
      if (previewedData) {
        this.graftwerkData = previewedData;
        if (this.profilingComponent) {
          this.profilingComponent.loadJSON(this.graftwerkData);
          this.profilingComponent.refresh(this.handsontableSelection);
        }
        this.loadedDataHeaders = this.graftwerkData[':column-names'].map(o => o.charAt(0) == ':' ? o.substr(1) : o);

      }
    });

    this.previewErrorSubscription = this.globalErrorSvc.previewErrorObs.subscribe((previewError) => {
      if (previewError) {
        this.previewError = previewError;
      } else {
        delete this.previewError;
      }
    });

    this.currentDataGraftStateSubscription = this.messageSvc.currentDataGraftStateSrc.subscribe((state) => {
      if (state.mode) {
        this.currentDataGraftState = state.mode;
        switch (this.currentDataGraftState) {
          case 'transformations.readonly':
            this.showPipelineOnly = true;
            this.showHandsonTableProfiling = false;
            break;
          case 'transformations.transformation':
            this.showPipelineOnly = false;
            this.showHandsonTableProfiling = false;
            break;
          case 'transformations.new':
            this.showPipelineOnly = false;
            this.showHandsonTableProfiling = false;
            break;
          case 'transformations.new.preview':
          case 'transformations.new.preview.wizard':
            this.showPipelineOnly = false;
            this.showHandsonTableProfiling = true;
            break;
          case 'transformations.transformation.preview':
          case 'transformations.transformation.preview.wizard':
            this.showPipelineOnly = false;
            this.showHandsonTableProfiling = true;
            break;
        }
      }
    });

    const paramMap = this.route.snapshot.paramMap;
    if (paramMap.has('publisher') && paramMap.has('transformationId')) {
      if (paramMap.has('filestoreId')) {
        this.showHandsonTableProfiling = true;
      }
      this.dispatch.getTransformation(paramMap.get('publisher'), paramMap.get('transformationId'))
        .then(
          (result) => {
            this.transformationSvc.transformationMetadata.next(result);
            this.transformationSvc.transformationMetadata.subscribe((metadata) => this.metadata = metadata);
            if (this.profilingComponent && this.graftwerkData) {
              this.profilingComponent.loadJSON(this.graftwerkData);
              this.profilingComponent.refresh(this.handsontableSelection);
            }
            this.title = result.title;
            this.description = result.description;
            this.keywords = result.keywords;
            this.isPublic = result.public;
          },
          (error) => {
            console.log(error);
          });
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
        this.transformationSvc.transformationMetadata.next(this.metadata);
      }
      else if (this.description !== this.metadata.description) {
        this.metadata.description = this.description;
        this.transformationSvc.transformationMetadata.next(this.metadata);
      }
      else if (this.keywords !== this.metadata.keywords) {
        this.metadata.keywords = this.keywords;
        this.transformationSvc.transformationMetadata.next(this.metadata);
      }
      else if (this.isPublic !== this.metadata.isPublic) {
        this.metadata.isPublic = this.isPublic;
        this.transformationSvc.transformationMetadata.next(this.metadata);
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
