import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { ProfilingComponent } from './profiling/profiling.component';
import { HandsontableComponent } from './handsontable/handsontable.component';
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
    const paramMap = this.route.snapshot.paramMap;
    if (paramMap.has('publisher') && paramMap.has('transformationId')) {
      this.dispatch.getTransformationJson(paramMap.get('transformationId'), paramMap.get('publisher'))
        .then(
        (result) => {
          const transformationObj = transformationDataModel.Transformation.revive(result);

          console.log(transformationObj);
          if (paramMap.has('filestoreId')) {
            /*previewTransformation(filestoreID: string, clojure: string, page?: number, pageSize?: number): Promise<any> {*/
            const clojure = generateClojure.fromTransformation(transformationObj);
            this.transformationSvc.previewTransformation(paramMap.get('filestoreId'), clojure)
              .then(
              (result) => {
                
                console.log(result);
                this.handsonTable.dispayJsEdnData(result);
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

  emitFunction(value: any) {
    this.function = value;
    console.log(value)
  }

}
