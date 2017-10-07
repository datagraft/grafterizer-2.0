import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { PipelineGeneratorService } from './pipeline-generator.service';

import * as generateClojure from '../../../../assets/generateclojure.js';
import * as transformationDataModel from '../../../../assets/transformationdatamodel.js';

import * as data from '../../../../assets/data.json';

@Component({
  selector: 'pipeline',
  templateUrl: './pipeline.component.html',
  styleUrls: ['./pipeline.component.css'],
  providers: [PipelineGeneratorService]
})

export class PipelineComponent implements OnInit {

  constructor(private pipelineGenerator: PipelineGeneratorService) { }

  @Input() function: any;
  private clojure: any;
  private activePipelineStep: boolean;
  private tdm: any;
  private steps: any = [];

  ngOnInit() {
    this.generatePipeline();
  }

  addStep() {

  }

  generateClojure() {
    this.clojure = generateClojure.fromTransformation(transformationDataModel.Transformation.revive(data));
    console.log(this.function);
    return this.clojure;
  }

  generatePipeline() {
    let promise = new Promise((resolve, reject) => {
      resolve(this.tdm = transformationDataModel.Transformation.revive(data));
    }
    );
    promise.then((result) => {
      for (let functions of this.tdm.pipelines["0"].functions) {
        this.steps.push(functions.__type);
      }
      console.log(result);
    })
  }

  /*   ngOnChanges(changes: any) {
      console.log('change');
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
        })
          .then(() => {
            this.steps = this.steps2;
          });
      }
    }
   */
}
