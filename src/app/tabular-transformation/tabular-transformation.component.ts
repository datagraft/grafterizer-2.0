import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit, KeyValueDiffers, DoCheck, ChangeDetectorRef } from '@angular/core';
import { ProfilingComponent } from './profiling/profiling.component';
import { HandsontableComponent } from './handsontable/handsontable.component';
import { PipelineComponent } from './sidebar/pipeline/pipeline.component'
import { RecommenderService } from './sidebar/recommender.service';
import { DispatchService } from '../dispatch.service';
import { TransformationService } from 'app/transformation.service';
import { RouterUrlService } from './component-communication.service';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import * as transformationDataModel from 'assets/transformationdatamodel.js';
import * as generateClojure from 'assets/generateclojure.js';
import { Subscription } from 'rxjs/Subscription';

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
  private differ: any;
  private handsontableSelection: any;
  private loadedDataHeaders: any

  // Local objects/ working memory initialized oninit - removed ondestroy, content transferred to observable ondestroy
  private transformationObj: any;
  private previewedTransformationObj: any;
  private graftwerkData: any;

  private transformationSubscription: Subscription;
  private previewedTransformationSubscription: Subscription;
  private dataSubscription: Subscription;

  @ViewChild(HandsontableComponent) handsonTable: HandsontableComponent;
  @ViewChild(PipelineComponent) pipelineComponent: PipelineComponent;
  @ViewChild(ProfilingComponent) profilingComponent: ProfilingComponent;

  constructor(private recommenderService: RecommenderService, private dispatch: DispatchService,
               private transformationSvc: TransformationService, private routerService: RouterUrlService,
               private route: ActivatedRoute, private router: Router, private differs: KeyValueDiffers, private cd: ChangeDetectorRef) {
    this.differ = differs.find({}).create(null);
    this.recommendations = [
      { label: 'Add columns', value: { id: 'AddColumnsFunction', defaultParams: null } },
      { label: 'Derive column', value: { id: 'DeriveColumnFunction', defaultParams: null } },
      { label: 'Deduplicate', value: { id: 'RemoveDuplicatesFunction', defaultParams: null } },
      { label: 'Add row', value: { id: 'AddRowFunction', defaultParams: null } },
      { label: 'Make dataset', value: { id: 'MakeDatasetFunction', defaultParams: null } },
      { label: 'Reshape dataset', value: { id: 'MeltFunction', defaultParams: null } },
      { label: 'Set first row as a header', value: { id: 'make-dataset-header', defaultParams: { moveFirstRowToHeader: true } } },
      { label: 'Sort dataset', value: { id: 'SortDatasetFunction', defaultParams: null } },
      { label: 'Take rows', value: { id: 'DropRowsFunction', defaultParams: null } },
      { label: 'Take columns', value: { id: 'ColumnsFunction', defaultParams: null } },
      { label: 'Custom function', value: { id: 'UtilityFunction', defaultParams: null } }
    ];
    route.url.subscribe(() => this.concatURL());
  }

  ngOnInit() {
//    this.transformationSubscription =
//      this.transformationSvc.currentTransformationObj.subscribe((message) => {
//      this.transformationObj = message;
//    });
    
    this.previewedTransformationSubscription = this.transformationSvc.currentPreviewedTransformationObj
      .subscribe((previewedTransformation) => {
      this.previewedTransformationObj = previewedTransformation;
      this.updatePreviewedData();
    });
  
    this.dataSubscription = this.transformationSvc.currentGraftwerkData.subscribe(previewedData => {
      if (previewedData) {
        console.log(previewedData);
        this.graftwerkData = previewedData;
//        this.handsonTable.showLoading = true;
//        this.handsonTable.displayJsEdnData(this.graftwerkData);
        this.profilingComponent.loadJSON(this.graftwerkData);
        this.profilingComponent.refresh(this.handsontableSelection);
        this.loadedDataHeaders = this.graftwerkData[':column-names'].map(o => o.substring(1, o.length));
        this.cd.detectChanges();
        setTimeout(() => {
//          this.pipelineComponent.generateLabels();
        });
      }
    });
  }

  ngOnDestroy() {
//    this.transformationSubscription.unsubscribe();
    this.dataSubscription.unsubscribe();
    this.previewedTransformationSubscription.unsubscribe();
//    this.transformationSvc.changeTransformationObj(this.transformationObj);
//    this.transformationSvc.changeGraftwerkData(this.graftwerkData);
  }


  concatURL() {
    this.route.snapshot.url.pop();
    let str = '';
    for (let o in this.route.snapshot.url) {
      str = str.concat(this.route.snapshot.url[o].path);
      str = str.concat('/');
    }
    this.routerService.sendMessage(str);
  }

  updatePreviewedData() {
    this.profilingComponent.progressbar = true;
    const paramMap = this.route.snapshot.paramMap;
    const clojure = generateClojure.fromTransformation(this.previewedTransformationObj);
    this.transformationSvc.previewTransformation(paramMap.get('filestoreId'), clojure, 1, 600)
      .then((result) => {
      this.transformationSvc.changeGraftwerkData(result);
//      this.handsonTable.showLoading = true;
//      this.handsonTable.displayJsEdnData(result);
      this.profilingComponent.loadJSON(result);
      this.profilingComponent.refresh(this.handsontableSelection);
//      this.pipelineComponent.generateLabels();
      this.loadedDataHeaders = result[':column-names'].map(o => o.substring(1, o.length));
      this.profilingComponent.progressbar = false;
    }, (err) => {
      // TODO - remove loading bar?
//      this.handsonTable.showLoading = false;
      console.log(err);
    })
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
      newSelection.row, newSelection.col, newSelection.row2, newSelection.col2, newSelection.totalRows, newSelection.totalCols, data, headers);
    this.recommendations = recommend;
  }

}
