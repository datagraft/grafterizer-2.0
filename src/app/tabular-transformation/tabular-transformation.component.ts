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
  private differ: any;
  private handsontableSelection: any;

  @ViewChild(HandsontableComponent) handsonTable: HandsontableComponent;
  @ViewChild(PipelineComponent) pipelineComponent: PipelineComponent;
  @ViewChild(ProfilingComponent) profilingComponent: ProfilingComponent;

  constructor(private recommenderService: RecommenderService, private dispatch: DispatchService,
    private transformationSvc: TransformationService, private route: ActivatedRoute, private router: Router, private differs: KeyValueDiffers) {
    this.differ = differs.find({}).create(null);
  }

  ngOnInit() {
    // recommender testing
    // let time1 = performance.now();
    // console.log(this.recommenderService.getRecommendation((this.recommenderService.getDataProfile(0, 0, 20, 0, 20, 4))));
    // console.log(performance.now() - time1 + " ms");
  }

  ngAfterViewInit() {
    this.existingTransformation();
  }

  ngDoCheck() {
    const change = this.differ.diff(this.transformationSvc.transformationObj.pipelines["0"].functions);
    if (change) {
      console.log('transformationObj.pipelines["0"].functions changed');
      if (this.function) {
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
                this.handsonTable.displayJsEdnData(result);
                this.profilingComponent.loadJSON(result);
                this.transformationSvc.transformationObj = transformationObj;
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
    const paramMap = this.route.snapshot.paramMap;
    const clojure = generateClojure.fromTransformation(this.transformationSvc.transformationObj);
    this.transformationSvc.previewTransformation(paramMap.get('filestoreId'), clojure)
      .then((result) => {
        this.handsonTable.displayJsEdnData(result);
        this.profilingComponent.loadJSON(result);
        this.profilingComponent.refresh(this.handsontableSelection);
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
        console.log(this.partialPipeline);
      })
  }

  tableSelectionChanged(newSelection: any) {
    this.handsontableSelection = newSelection;
    this.profilingComponent.refresh(newSelection);
    /*     const profile = this.recommenderService
          .getDataProfile(newSelection.row, newSelection.col,
          newSelection.row2, newSelection.col2,
          newSelection.totalRows, newSelection.totalCols);
        const recommend = this.recommenderService.getRecommendation(profile);
        console.log(recommend);
        this.recommenderService.getDataProfile() */
  }

  emitFunction(value: any) {
    this.function = value;
  }

  editFunction(pipeline) {
    console.log(pipeline);
    if (pipeline.edit == true) {
      this.updateTransformation();
    }
    else if (pipeline.preview == true) {
      this.getPartialTransformation(pipeline.function);
    }
  }

}
