import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
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
export class TabularTransformationComponent implements OnInit, AfterViewInit {

  private function: any;

  @ViewChild(HandsontableComponent) handsonTable: HandsontableComponent;
  @ViewChild(PipelineComponent) pipelineComponent: PipelineComponent;

  constructor(private recommenderService: RecommenderService, private dispatch: DispatchService,
    private transformationSvc: TransformationService,
    private route: ActivatedRoute, private router: Router) { }

  ngOnInit() {
    // recommender testing
    // let time1 = performance.now();
    // console.log(this.recommenderService.getRecommendation((this.recommenderService.getDataProfile(0, 0, 20, 0, 20, 4))));
    // console.log(performance.now() - time1 + " ms");
  }

  ngAfterViewInit() {
    this.existingTransformation();
  }

  // TODO: when this function executes --> global transformation object has been updated --> generate clojure code --> display new data in handsontable
  // Global transformation object = this.pipelineComponent.transformationObj
  updateTransformation(value: any) {
    console.log(value);
    const clojure = generateClojure.fromTransformation(this.pipelineComponent.transformationObj);
    // this.handsonTable.displayJsEdnData();
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
                console.log(result);
                this.handsonTable.displayJsEdnData(result);
                this.pipelineComponent.generatePipeline(transformationObj);
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
