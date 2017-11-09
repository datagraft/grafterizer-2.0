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
  private differ: any;

  @ViewChild(HandsontableComponent) handsonTable: HandsontableComponent;
  @ViewChild(PipelineComponent) pipelineComponent: PipelineComponent;

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
                this.transformationSvc.transformationObj = transformationObj;
                //console.log(this.transformationSvc.transformationObj);
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
        console.log(this.transformationSvc.transformationObj);
        console.log('data:');
        console.log(result);
      })
  }

  getPartialTransformation(untilFunction) {
    const paramMap = this.route.snapshot.paramMap;
    let partialTransformationObj = this.transformationSvc.transformationObj.pipelines[0].functions[untilFunction];
    this.transformationSvc.transformationObj.getPartialTransformation(partialTransformationObj);
    const clojure = generateClojure.fromTransformation(this.transformationSvc.transformationObj);
    this.transformationSvc.previewTransformation(paramMap.get('filestoreId'), clojure)
      .then((result) => {
        this.handsonTable.displayJsEdnData(result);
      })
  }

  tableSelectionChanged(newSelection: any) {
    console.log(newSelection);
    const profile = this.recommenderService
      .getDataProfile(newSelection.row, newSelection.col,
      newSelection.row2, newSelection.col2,
      newSelection.totalRows, newSelection.totalCols);
    const recommend = this.recommenderService.getRecommendation(profile);
    console.log(recommend);
    //    this.recommenderService.getDataProfile()
  }

  emitFunction(value: any) {
    this.function = value;
  }

}
