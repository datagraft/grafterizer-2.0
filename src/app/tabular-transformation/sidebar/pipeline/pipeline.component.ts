import { Component, Input, OnChanges, OnInit, Output, EventEmitter } from '@angular/core';
import { TransformationService } from '../../../transformation.service';
import { ComponentCommunicationService } from '../../component-communication.service';

@Component({
  moduleId: module.id,
  selector: 'pipeline',
  templateUrl: './pipeline.component.html',
  styleUrls: ['./pipeline.component.css'],
  providers: []
})

export class PipelineComponent implements OnChanges, OnInit {

  @Input() private function: any;
  @Output() private emitter = new EventEmitter();
  private steps: any = [];
  private addFunctionAfter: boolean;
  private edit: boolean;
  private lastFunctionIndex: number;
  private currentFunctionIndex: number;
  private position: string;
  private tooltip: boolean;
  private emitterObject: any;

  constructor(private transformationService: TransformationService, private componentCommunicationService: ComponentCommunicationService) {
    this.edit = false;
    this.addFunctionAfter = false;
    this.position = 'bottom-middle';
    this.tooltip = true;
    this.emitterObject = { edit: false, function: {}, preview: false };
  }

  ngOnInit() { }

  sendFunction(event) {
    this.edit = true;
    this.addFunctionAfter = true;
    this.currentFunctionIndex = parseInt(event.path[0].id);
    this.componentCommunicationService.sendMessage(this.transformationService.transformationObj.pipelines[0].functions[this.currentFunctionIndex]);
  }

  generateLabels() {
    let steps = [];
    this.lastFunctionIndex = 0;
    let functions = this.transformationService.transformationObj.pipelines[0].functions;
    if (this.emitterObject.preview == true) {
      functions.splice(this.currentFunctionIndex);
    }
    for (let f of functions) {
      let label = f.__type.slice(0, -8);
      steps.push({ 'type': label, 'id': this.lastFunctionIndex });
      this.lastFunctionIndex += 1;
    }
    this.steps = steps;
  }

  viewPartialPipeline() {
    this.emitterObject.preview = true;
    this.emitterObject.function = this.transformationService.transformationObj.pipelines[0].functions[this.currentFunctionIndex];
    this.emitter.emit(this.emitterObject);
  }

  functionAdd() {
    if (this.edit == true) {
      this.transformationService.transformationObj.pipelines[0].addAfter(this.transformationService.transformationObj.pipelines[0].functions[this.currentFunctionIndex], this.function);
      this.transformationService.transformationObj.pipelines[0].remove(this.transformationService.transformationObj.pipelines[0].functions[this.currentFunctionIndex]);
      this.emitterObject.edit = true;
      this.emitter.emit(this.emitterObject);
    }
    else if (this.edit == false && this.addFunctionAfter == true) {
      this.transformationService.transformationObj.pipelines[0].addAfter(this.transformationService.transformationObj.pipelines[0].functions[this.currentFunctionIndex], this.function);
      this.generateLabels();
    } else {
      this.transformationService.transformationObj.pipelines[0].addAfter(this.transformationService.transformationObj.pipelines[0].functions[this.lastFunctionIndex], this.function);
      this.generateLabels();
    }
    this.addFunctionAfter = false;
    console.log('add');
  }

  functionRemove() {
    this.transformationService.transformationObj.pipelines[0].remove(this.transformationService.transformationObj.pipelines[0].functions[this.currentFunctionIndex]);
    this.generateLabels();
    console.log('remove');
  }

  getModes(mode) {
    if (mode == 'add') {
      this.addFunctionAfter = true;
      this.tooltip = false;
      this.functionAdd();
    }
    else if (mode == 'remove') {
      this.functionRemove();
    }
    else if (mode == 'preview') {
      this.viewPartialPipeline();
    }
  }

  getButtonEvent(event) {
    let index;
    let mode;
    console.log(event);
    if (event.path[0].id != '') {
      index = event.path[0].id;
      mode = event.path[0].value;
      this.currentFunctionIndex = parseInt(index);
      this.getModes(mode);
    }
    else {
      index = event.path[1].id;
      mode = event.path[1].value;
      this.currentFunctionIndex = parseInt(index);
      this.getModes(mode);
    }
  }

  displayFunction(event) {
    let index = event.path[0].id
    this.currentFunctionIndex = index;
  }

  ngOnChanges(changes: any) {
    if (this.function) {
      this.functionAdd();
    }
  }
}
