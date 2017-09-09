import { Component } from '@angular/core';
import { PipelineFunction } from './pipeline/pipelineFunction';
import { PipelineComponent } from './pipeline/pipeline.component';

import * as transformationDataModel from '../assets/transformationdatamodel.js';
import * as generateClojure from '../assets/generateclojure.js';
import * as data from '../assets/data.json';

/*TODO:remove pipeline functions when done with components*/
import { Pipeline, MakeDatasetFunction } from "./transformation-data-model.service";
import { ColumnName } from './pipeline/column-name';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [Pipeline, MakeDatasetFunction]
})
export class AppComponent {
  private title = 'Click to generate clojure';
  generateClojure() {
    console.log(generateClojure.fromTransformation(transformationDataModel.Transformation.revive(data)));
    console.log(transformationDataModel.Transformation.revive(data));
  };
  /* testPipeline: PipelineFunction[] = [
   new PipelineFunction("make-dataset","MakeDatasetFunction"),
   new PipelineFunction("drop-rows","DropRowsFunction")
  ];*/
  testPipeline: Pipeline = new Pipeline([new MakeDatasetFunction([], false, 0, true, "docstring:string"), new MakeDatasetFunction(["a", "b", "c"], false, 0, false, "docstring:string")]);
}
/*const testPipeline: PipelineFunction[] = [
 new PipelineFunction("make-dataset"),
 new PipelineFunction("drop-rows")
];*/