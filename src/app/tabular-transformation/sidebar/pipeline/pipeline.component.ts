import { Component, Input, Output, EventEmitter, OnChanges, OnInit } from '@angular/core';
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

export class PipelineComponent implements OnChanges, OnInit {

  @Input() function: any;
  @Output() emitter = new EventEmitter();
  private clojure: any;
  private activePipelineStep: boolean;
  private steps: any = [];

  // GLOBAL TRANSFORMATION OBJECT
  public transformationObj: any;

  constructor(private pipelineGenerator: PipelineGeneratorService) { }

  ngOnInit() { }

  addPipelineStep(funct) {
    this.transformationObj.pipelines[0].functions.push(funct);
    return this.steps;
  }

  /*   generateClojure() {
      this.clojure = generateClojure.fromTransformation(transformationDataModel.Transformation.revive(data));
      console.log(this.function);
      return this.clojure;
    } */

  generateLabels(transformationObj) {
    this.steps = [];
    for (let functions of transformationObj.pipelines[0].functions) {
      this.steps.push(functions.__type);
    }
    return this.steps;
  }

  generatePipeline(transformationObj) {
    this.transformationObj = transformationObj;
    let promise = new Promise((resolve, reject) => {
      resolve(this.generateLabels(transformationObj));
    }
    );
    promise.then((result) => {
      console.log(result);
    })
  }

  ngOnChanges(changes: any) {
    console.log('change');
    let self = this;
    if (this.function) {
      let promise = new Promise((resolve, reject) => {
        resolve(self.addPipelineStep(changes['function'].currentValue));
      }
      );
      promise.then(() => {
        self.generateLabels(this.transformationObj);
        self.emitter.emit('Global transformation object updated');
        console.log(self.transformationObj);
      })
    }
  }
}
