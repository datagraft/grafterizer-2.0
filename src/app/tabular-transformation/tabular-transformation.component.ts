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
import { Message } from '@angular/compiler/src/i18n/i18n_ast';

@Component({
  selector: 'app-tabular-transformation',
  templateUrl: './tabular-transformation.component.html',
  styleUrls: ['./tabular-transformation.component.css'],
  providers: [RecommenderService, DispatchService]
})

export class TabularTransformationComponent implements OnInit, OnDestroy, AfterViewInit, DoCheck {

  private function: any;
  private partialPipeline: any;
  private pipelineDefaultState: any;
  private recommendations: any;
  private differ: any;
  private handsontableSelection: any;
  private loadedDataHeaders: any

  // Local objects/ working memory initialized oninit - removed ondestroy, content transferred to observable ondestroy
  private transformationObj: any;
  private graftwerkData: any;

  @ViewChild(HandsontableComponent) handsonTable: HandsontableComponent;
  @ViewChild(PipelineComponent) pipelineComponent: PipelineComponent;
  @ViewChild(ProfilingComponent) profilingComponent: ProfilingComponent;

  constructor(private recommenderService: RecommenderService, private dispatch: DispatchService,
    private transformationSvc: TransformationService, private routerService: RouterUrlService, private route: ActivatedRoute, private router: Router, private differs: KeyValueDiffers, private cd: ChangeDetectorRef) {
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
    this.transformationSvc.currentTransformationObj.subscribe(message => this.transformationObj = message);
    this.transformationSvc.currentGraftwerkData.subscribe(message => this.graftwerkData = message);
  }

  ngOnDestroy() {
    this.transformationSvc.changeTransformationObj(this.transformationObj);
    this.transformationSvc.changeGraftwerkData(this.graftwerkData);
  }

  ngAfterViewInit() {
    if (this.graftwerkData == null) {
      console.log('TEST 1 OK')
      this.existingTransformation();
    }
    else {
      console.log('TEST 2 OK')
      this.handsonTable.showLoading = true;
      this.handsonTable.displayJsEdnData(this.graftwerkData);
      this.profilingComponent.loadJSON(this.graftwerkData);
      this.profilingComponent.refresh(this.handsontableSelection);
      this.loadedDataHeaders = this.graftwerkData[":column-names"].map(o => o.substring(1, o.length));
      this.cd.detectChanges();
      setTimeout(() => {
        this.pipelineComponent.generateLabels();
      });
    }
  }

  ngDoCheck() {
    const change = this.differ.diff(this.transformationSvc.transformationObj.pipelines["0"].functions);
    if (change) {
      if (this.function) {
        this.updateTransformation();
      }
    }
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

  getChanges(oldArray, newArray) {
    var changes, i, item, j, len;
    if (JSON.stringify(oldArray) === JSON.stringify(newArray)) {
      return false;
    }
    changes = [];
    for (i = j = 0, len = newArray.length; j < len; i = ++j) {
      item = newArray[i];
      if (JSON.stringify(item) !== JSON.stringify(oldArray[i])) {
        changes.push(item);
      }
    }
    return changes;
  };

  existingTransformation() {
    const paramMap = this.route.snapshot.paramMap;
    if (paramMap.has('publisher') && paramMap.has('transformationId')) {
      this.dispatch.getTransformationJson(paramMap.get('transformationId'), paramMap.get('publisher'))
        .then(
        (result) => {
          let transformationObj = transformationDataModel.Transformation.revive(result);
          console.log(transformationObj)
          if (paramMap.has('filestoreId')) {
            const clojure = generateClojure.fromTransformation(transformationObj);
            this.transformationSvc.previewTransformation(paramMap.get('filestoreId'), clojure, 1, 600)
              .then(
              (result) => {
                console.log(result);
                this.handsonTable.showLoading = true;
                this.transformationSvc.transformationObj = transformationObj;
                this.transformationObj = transformationObj;
                this.graftwerkData = result;
                this.loadedDataHeaders = result[":column-names"].map(o => o.substring(1, o.length));
                // this.graftwerkData[":column-names"] = this.loadedDataHeaders;
                this.handsonTable.displayJsEdnData(result);
                this.profilingComponent.loadJSON(result);
                this.pipelineComponent.generateLabels();
              },
              (error) => {
                console.log('ERROR getting filestore!');
                console.log(error);
              });
          }
        },
        (error) => {
          console.log(error)
        });
    }
  }

  updateTransformation() {
    this.profilingComponent.progressbar = true;
    const paramMap = this.route.snapshot.paramMap;
    const clojure = generateClojure.fromTransformation(this.transformationSvc.transformationObj);
    this.transformationSvc.previewTransformation(paramMap.get('filestoreId'), clojure, 1, 600)
      .then((result) => {
        this.handsonTable.showLoading = true;
        this.graftwerkData = result;
        this.handsonTable.displayJsEdnData(result);
        this.profilingComponent.loadJSON(result);
        this.profilingComponent.refresh(this.handsontableSelection);
        this.pipelineComponent.generateLabels();
        this.loadedDataHeaders = result[":column-names"].map(o => o.substring(1, o.length));
        this.profilingComponent.progressbar = false;
      }, (err) => {
        console.log(err);
      })
  }

  getPartialTransformation(untilFunction) {
    const paramMap = this.route.snapshot.paramMap;
    this.pipelineDefaultState = this.deepCopyArray(this.transformationSvc.transformationObj.pipelines[0].functions);
    const clojure = generateClojure.fromTransformation(this.transformationSvc.transformationObj.getPartialTransformation(untilFunction));
    this.transformationSvc.previewTransformation(paramMap.get('filestoreId'), clojure)
      .then((result) => {
        this.handsonTable.displayJsEdnData(result);
        this.pipelineComponent.generateLabels();
      })
  }

  tableSelectionChanged(newSelection: any) {
    this.handsontableSelection = newSelection;
    this.profilingComponent.refresh(newSelection);
    var ind = this.handsonTable.hot.getSelected();
    var data = [];
    var headers = [];
    for (let i = ind[0]; i <= ind[2]; ++i) {
      var row = [];
      for (let j = ind[1]; j <= ind[3]; ++j) {
        row.push(this.handsonTable.hot.getDataAtCell(i, j));
      }
      data.push(row);
    }
    for (let j = ind[1]; j <= ind[3]; ++j) {
      headers.push(this.handsonTable.hot.getColHeader(j));
    }
    const recommend = this.recommenderService.getRecommendationWithParams(newSelection.row, newSelection.col,
      newSelection.row2, newSelection.col2,
      newSelection.totalRows, newSelection.totalCols, data, headers);
    this.recommendations = recommend;
  }

  emitFunction(value: any) {
    this.function = value;
    // this.updateTransformation();
  }

  deepCopyArray(o) {
    var output, v, key;
    output = Array.isArray(o) ? [] : {};
    for (key in o) {
      v = o[key];
      output[key] = (typeof v === "object") ? this.deepCopyArray(v) : v;
    }
    return output;
  }

  editFunction(pipeline) {
    console.log(pipeline);
    if (pipeline.edit == true) {
      this.updateTransformation();
    }
    else if (pipeline.preview == true) {
      this.getPartialTransformation(pipeline.function);
    }
    else if (pipeline.undoPreview == true) {
      this.transformationSvc.transformationObj.pipelines[0].functions = this.pipelineDefaultState;
      this.updateTransformation();
    }
  }

}
