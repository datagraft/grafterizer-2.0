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
  private steps: any;
  private edit: boolean;
  private lastFunctionIndex: number;
  public currentFunctionIndex: number;
  private position: string;
  private tooltip: boolean;
  private visible: boolean;
  private emitterObject: any;

  constructor(private transformationService: TransformationService, private componentCommunicationService: ComponentCommunicationService) {
    this.steps = [];
    this.edit = false;
    this.position = 'bottom-middle';
    this.tooltip = true;
    this.visible = true;
    this.emitterObject = { edit: false, function: {}, preview: false, undoPreview: false };
  }

  ngOnInit() { }

  sendFunction() {
    this.edit = true;
    console.log(this.currentFunctionIndex);
    this.componentCommunicationService.sendMessage(this.transformationService.transformationObj.pipelines[0].functions[this.currentFunctionIndex]);
  }

  generateLabels() {
    let steps = [];
    this.lastFunctionIndex = 0;
    let functions = this.transformationService.transformationObj.pipelines[0].functions;
    if (this.emitterObject.preview == true) {
      functions.splice(this.currentFunctionIndex + 1);
    }
    for (let f of functions) {
      let label = f.__type;
      steps.push({ 'type': this.verboseLabels(label), 'id': this.lastFunctionIndex, docstring: f.docstring });
      this.lastFunctionIndex += 1;
    }
    this.steps = steps;
    console.log(this.steps);
  }

  verboseLabels(label) {
    if (label == 'DropRowsFunction') {
      return 'Rows deleted'
    }
    if (label == 'MakeDatasetFunction') {
      return 'Headers created'
    }
    if (label == 'UtilityFunction') {
      return 'Utility'
    }
    if (label == 'DropRowsFunction') {
      return 'Rows deleted'
    }
    if (label == 'MapcFunction') {
      return 'Columns mapped'
    }
    if (label == 'MeltFunction') {
      return 'Dataset reshaped'
    }
    if (label == 'DeriveColumnFunction') {
      return 'Column derived'
    }
    if (label == 'AddColumnsFunction') {
      return 'Column(s) added'
    }
    if (label == 'AddRowFunction') {
      return 'Row(s) added'
    }
    if (label == 'RenameColumnsFunction') {
      return 'Header title(s) changed'
    }
    if (label == 'GrepFunction') {
      return 'Row(s) filtered'
    }
  }

  viewPipeline() {
    this.emitterObject.preview = false;
    this.emitterObject.undoPreview = true;
    this.emitter.emit(this.emitterObject);
  }

  viewPartialPipeline() {
    this.emitterObject.preview = true;
    this.emitterObject.function = this.transformationService.transformationObj.pipelines[0].functions[this.currentFunctionIndex + 1];
    this.emitter.emit(this.emitterObject);
  }

  functionAdd() {
    if (this.edit == true) {
      this.transformationService.transformationObj.pipelines[0].addAfter(this.transformationService.transformationObj.pipelines[0].functions[this.currentFunctionIndex], this.function);
      this.transformationService.transformationObj.pipelines[0].remove(this.transformationService.transformationObj.pipelines[0].functions[this.currentFunctionIndex]);
      this.emitterObject.edit = true;
      this.emitter.emit(this.emitterObject);
    }
    else {
      this.transformationService.transformationObj.pipelines[0].addAfter(this.transformationService.transformationObj.pipelines[0].functions[this.lastFunctionIndex], this.function);
    }
    console.log(this.transformationService.transformationObj);
  }

  functionRemove() {
    this.transformationService.transformationObj.pipelines[0].remove(this.transformationService.transformationObj.pipelines[0].functions[this.currentFunctionIndex]);
  }

  getModes(mode) {
    if (mode == 'history') {
      this.viewPipeline();
    }
    else if (mode == 'remove') {
      this.functionRemove();
    }
    else if (mode == 'preview') {
      this.viewPartialPipeline();
    }
    else if (mode == 'edit') {
      this.sendFunction();
      console.log('edit')
    }
  }

  getButtonEvent(event) {
    let index;
    let mode;
    console.log(event);
    index = event.path[2].id;
    mode = event.path[2].value;
    this.currentFunctionIndex = parseInt(index);
    this.getModes(mode);
    console.log(index)
    console.log(mode)
  }

  displayFunction(event) {
    let index = event.path[2].id
    this.currentFunctionIndex = index;
    console.log(index)
  }

  ngOnChanges(changes: any) {
    if (this.function) {
      console.log('onChanges pipeline component');
      console.log(this.function);
      this.functionAdd();
    }
  }
}
