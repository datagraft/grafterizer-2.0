import { Component, OnInit, ViewChild, AfterViewInit, KeyValueDiffers, DoCheck } from '@angular/core';
import { ProfilingComponent } from './profiling/profiling.component';
import { HandsontableComponent } from './handsontable/handsontable.component';
import { PipelineComponent } from './sidebar/pipeline/pipeline.component'
import { RecommenderService } from './sidebar/recommender.service';
import { DispatchService } from '../dispatch.service';
import { TransformationService } from 'app/transformation.service';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import * as transformationDataModel from 'assets/transformationdatamodel.js';
import * as generateClojure from 'assets/generateclojure.js';

@Component({
  selector: 'app-tabular-transformation',
  templateUrl: './tabular-transformation.component.html',
  styleUrls: ['./tabular-transformation.component.css'],
  providers: [RecommenderService, DispatchService, TransformationService]
})

export class TabularTransformationComponent implements OnInit, AfterViewInit, DoCheck {

  private function: any;
  private partialPipeline: any;
  private recommendations: any;
  private differ: any;
  private handsontableSelection: any;
  private loadedDataHeaders: any

  @ViewChild(HandsontableComponent) handsonTable: HandsontableComponent;
  @ViewChild(PipelineComponent) pipelineComponent: PipelineComponent;
  @ViewChild(ProfilingComponent) profilingComponent: ProfilingComponent;

  constructor(private recommenderService: RecommenderService, private dispatch: DispatchService,
    private transformationSvc: TransformationService, private route: ActivatedRoute, private router: Router, private differs: KeyValueDiffers) {
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
  }

  ngOnInit() { }

  ngAfterViewInit() { this.existingTransformation(); }

  ngDoCheck() {
    const change = this.differ.diff(this.transformationSvc.transformationObj.pipelines["0"].functions);
    if (change) {
      console.log('tabular-transformation.component.ts: ngDoCheck()');
      if (this.function) {
        console.log('transformationObj.pipelines["0"].functions changed', this.function);
        this.updateTransformation();
      }
    }
  }

  existingTransformation() {
    const paramMap = this.route.snapshot.paramMap;
    if (paramMap.has('publisher') && paramMap.has('transformationId')) {
      this.dispatch.getTransformationJson(paramMap.get('transformationId'), paramMap.get('publisher'))
        .then(
        (result) => {
          let transformationObj = transformationDataModel.Transformation.revive(result);
          if (paramMap.has('filestoreId')) {
            const clojure = generateClojure.fromTransformation(transformationObj);
            this.transformationSvc.previewTransformation(paramMap.get('filestoreId'), clojure)
              .then(
              (result) => {
                this.loadedDataHeaders = result[":column-names"].map(o => o.substring(1, o.length));
                this.handsonTable.displayJsEdnData(result);
                this.profilingComponent.loadJSON(result);
                this.transformationSvc.transformationObj = transformationObj;
                this.pipelineComponent.generateLabels();
                console.log('tabular-transformation.component.ts: existingTransformation()');
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
    const paramMap = this.route.snapshot.paramMap;
    const clojure = generateClojure.fromTransformation(this.transformationSvc.transformationObj);
    this.transformationSvc.previewTransformation(paramMap.get('filestoreId'), clojure)
      .then((result) => {
        this.handsonTable.showLoading = true;
        this.handsonTable.displayJsEdnData(result);
        this.profilingComponent.loadJSON(result);
        this.profilingComponent.refresh(this.handsontableSelection);
        // Get headers of the transformed dataset, remove :
        this.loadedDataHeaders = result[":column-names"].map(o => o.substring(1, o.length));
        console.log('tabular-transformation.component.ts: updateTransformation()')
      }, (err) => {
        console.log(err);
      })
  }

  getPartialTransformation(untilFunction) {
    const paramMap = this.route.snapshot.paramMap;
    this.partialPipeline = this.transformationSvc.transformationObj.getPartialTransformation(untilFunction);
    const clojure = generateClojure.fromTransformation(this.partialPipeline);
    this.transformationSvc.previewTransformation(paramMap.get('filestoreId'), clojure)
      .then((result) => {
        this.handsonTable.displayJsEdnData(result);
        this.pipelineComponent.generateLabels();
        // console.log(this.partialPipeline);
        console.log('tabular-transformation.component.ts: getPartialTransformation(untilFunction)')
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
    console.log('tabular-transformation.component.ts: tableSelectionChanged(newSelection: any)')
  }

  emitFunction(value: any) {
    this.function = value;
    console.log('tabular-transformation.component.ts: emitFunction(value: any)')
  }

  editFunction(pipeline) {
    console.log(pipeline);
    if (pipeline.edit == true) {
      this.updateTransformation();
    }
    else if (pipeline.preview == true) {
      this.getPartialTransformation(pipeline.function);
    }
    console.log('tabular-transformation.component.ts: editFunction(pipeline)')
  }

}
