import { Component, OnInit } from '@angular/core';
import { ProfilingComponent } from "./profiling/profiling.component";
import { HandsontableComponent } from "./handsontable/handsontable.component";
import { RecommenderService } from "./sidebar/recommender.service";

@Component({
  selector: 'tabular-transformation',
  templateUrl: './tabular-transformation.component.html',
  styleUrls: ['./tabular-transformation.component.css'],
  providers: [RecommenderService]
})
export class TabularTransformationComponent implements OnInit {

  constructor(private recommenderService: RecommenderService) { }

  private function: any;

  ngOnInit() {
    // recommender testing
    // let time1 = performance.now();
    // console.log(this.recommenderService.getRecommendation((this.recommenderService.getDataProfile(0, 0, 20, 0, 20, 4))));
    // console.log(performance.now() - time1 + " ms");
  }

  emitFunction(value: any) {
    this.function = value;
    console.log(value)
  }

}
