import { Component, Input, EventEmitter, OnChanges, OnInit } from '@angular/core';
import { TransformationService } from '../../../transformation.service';
import { TabularTransformationService } from '../../tabular-transformation.service';

@Component({
  moduleId: module.id,
  selector: 'pipeline',
  templateUrl: './pipeline.component.html',
  styleUrls: ['./pipeline.component.css'],
  providers: []
})

export class PipelineComponent implements OnChanges, OnInit {

  @Input() function: any;
  private steps: any = [];
  private addFunctionAfter: boolean;
  private lastFunctionIndex: number;
  private currentFunctionIndex: number;
  private position: string;
  private tooltip: boolean;

  constructor(private transformationService: TransformationService, private tabularTransformationService: TabularTransformationService) {
    this.addFunctionAfter = false;
    this.position = 'bottom-middle';
    this.tooltip = true;
  }

  ngOnInit() { }

  sendFunction(event) {
    this.currentFunctionIndex = event.path[0].id;
    this.tabularTransformationService.sendMessage(this.transformationService.transformationObj.pipelines[0].functions[this.currentFunctionIndex]);
  }

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

  functionAdd() {
    if (this.addFunctionAfter == true) {
      this.transformationService.transformationObj.pipelines[0].addAfter(this.transformationService.transformationObj.pipelines[0].functions[this.currentFunctionIndex], this.function);
    } else {
      this.transformationService.transformationObj.pipelines[0].addAfter(this.transformationService.transformationObj.pipelines[0].functions[this.lastFunctionIndex], this.function);
    }
    this.generateLabels();
    this.addFunctionAfter = false;
  }

  functionRemove() {
    this.transformationService.transformationObj.pipelines[0].remove(this.transformationService.transformationObj.pipelines[0].functions[this.currentFunctionIndex]);
    this.generateLabels();
  }

  getButtonEvent(event) {
    if (event.path[2].id != '') {
      this.currentFunctionIndex = event.path[2].id;
      if (event.path[2].value == 'add') {
        this.addFunctionAfter = true;
        this.tooltip = false;
        this.functionAdd();
      }
      else if (event.path[2].value == 'remove') {
        this.functionRemove();
      }
    }
    else {
      this.currentFunctionIndex = event.path[3].id;
      if (event.path[3].value == 'add') {
        this.addFunctionAfter = true;
        this.tooltip = false;
        this.functionAdd();
      }
      else if (event.path[3].value == 'remove') {
        this.functionRemove();
      }
    }
  }

  displayFunction(event) {
    this.currentFunctionIndex = event.path[0].id;
    console.log(this.currentFunctionIndex);
  }

  ngOnChanges(changes: any) {
    if (this.function) {
      this.functionAdd();
    }
  }
}
