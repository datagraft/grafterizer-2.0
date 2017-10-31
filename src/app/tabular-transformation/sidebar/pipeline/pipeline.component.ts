import { Component, Input, Output, EventEmitter, OnChanges, OnInit, forwardRef } from '@angular/core';
import { TransformationService } from '../../../transformation.service';

import * as generateClojure from '../../../../assets/generateclojure.js';
import * as transformationDataModel from '../../../../assets/transformationdatamodel.js';
import * as data from '../../../../assets/data.json';

@Component({
  selector: 'pipeline',
  templateUrl: './pipeline.component.html',
  styleUrls: ['./pipeline.component.css'],
  providers: []
})

export class PipelineComponent implements OnChanges, OnInit {

  @Input() function: any;
  @Output() emitter = new EventEmitter();
  private steps: any = [];
  private addFunctionAfter: boolean;
  private lastFunctionIndex: number;
  private currentFunctionIndex: number;
  private position: string;
  private tooltip: boolean;

  constructor(private transformationService: TransformationService) {
    this.addFunctionAfter = false;
    this.position = 'bottom-middle';
    this.tooltip = true;
  }

  ngOnInit() { }

  generateLabels() {
    this.steps = [];
    this.lastFunctionIndex = 0;
    for (let functions of this.transformationService.transformationObj.pipelines[0].functions) {
      let label = functions.__type.slice(0, -8);
      this.steps.push({ 'type': label, 'id': this.lastFunctionIndex });
      this.lastFunctionIndex += 1;
    }
    return this.steps;
  }

  functionAdd(index) {
    this.transformationService.transformationObj.pipelines[0].addAfter(this.transformationService.transformationObj.pipelines[0].functions[index], this.function);
    return 'OK';
  }

  functionRemove(index) {
    this.transformationService.transformationObj.pipelines[0].remove(this.transformationService.transformationObj.pipelines[0].functions[index]);
    this.generateLabels();
  }

  getButtonEvent(event) {
    if (event.path[2].id != '') {
      this.currentFunctionIndex = event.path[2].id;
      if (event.path[2].value == 'add') {
        this.addFunctionAfter = true;
        this.tooltip = false;
      }
      else if (event.path[2].value == 'remove') {
        this.functionRemove(this.currentFunctionIndex);
      }
    }
    else {
      this.currentFunctionIndex = event.path[3].id;
      if (event.path[3].value == 'add') {
        this.addFunctionAfter = true;
        this.tooltip = false;
      }
      else if (event.path[3].value == 'remove') {
        this.functionRemove(this.currentFunctionIndex);
      }
    }
  }

  ngOnChanges(changes: any) {
    console.log(changes.function.currentValue);
    let self = this;
    if (this.function) {
      let promise = new Promise((resolve, reject) => {
        if (self.addFunctionAfter == true) {
          resolve(self.functionAdd(self.currentFunctionIndex));
          this.addFunctionAfter = false;
        } else {
          resolve(self.functionAdd(self.lastFunctionIndex));
          this.addFunctionAfter = false;
        }
      }
      );
      promise.then(() => {
        self.generateLabels();
      })
    }
  }
}
