import { Component, Input, OnChanges } from '@angular/core';
import { PipelineGeneratorService } from './pipeline-generator.service';

import * as generateClojure from '../../../../assets/generateclojure.js';
import * as transformationDataModel from '../../../../assets/transformationdatamodel.js';

@Component({
  selector: 'pipeline',
  templateUrl: './pipeline.component.html',
  styleUrls: ['./pipeline.component.css'],
  providers: [PipelineGeneratorService]
})

export class PipelineComponent implements OnChanges {

  constructor(private pipelineGenerator: PipelineGeneratorService) { }

  @Input() function: any;
  private clojure: any;
  private activePipelineStep: boolean;


  generateClojure() {
    this.clojure = generateClojure.fromTransformation(transformationDataModel.Transformation.revive(this.pipelineGenerator.pipeline));
    console.log(this.function);
    return this.clojure;
  }

  ngOnChanges(changes: any) {
    let self = this;
    if (this.function) {
      let promise = new Promise(function (resolve, reject) {
        self.pipelineGenerator.generatePipeline(changes['function'].currentValue);
        if (self.pipelineGenerator.pipeline) {
          resolve(self.generateClojure());
        }
        else {
          reject(Error('Pipeline error - function not added'));
        }
      }
      );
      promise.then(function (result) {
        console.log(result);
      });
    }
  }

  getPipelineStepLabel() {
    if (this.function.__type == 'MakeDatasetFunction') {
      return 'Created header';
    }
  }
}
