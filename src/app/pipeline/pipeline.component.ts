import { Component, OnInit, Input } from '@angular/core';
import { PipelineFunction } from './pipelineFunction';
import { Pipeline } from "../transformation-data-model.service";

@Component({
  selector: 'pipeline-steps',
  templateUrl: './pipeline.component.html',
  styleUrls: ['./pipeline.component.css']
})
export class PipelineComponent implements OnInit {
  public addFunction: boolean = false;
  public editFunction: boolean = false;
  public deleteModal: boolean = false;
  public noNewFunction: boolean = false;
  addAfterFunction: PipelineFunction;
  selectedStep: PipelineFunction;
  @Input() pipeline: Pipeline;
  //TODO: pass the transformations
  @Input() transformation: string;
  private newFunction: PipelineFunction;
  constructor() { }


  ngOnInit() {
  };

  clickEditFunction(pipelineFunction: PipelineFunction): void {
    this.selectedStep = pipelineFunction;
    this.editFunction = true;

  };

  addFunctionAfter(pipelineFunction: PipelineFunction): void {
    this.addFunction = true;
    this.selectedStep = null;
    this.addAfterFunction = pipelineFunction;

  };
  addedFunction(newFunction: PipelineFunction) {
    this.newFunction = newFunction;
  }
  removeFunction(pipelineFunction: PipelineFunction): void {

    this.pipeline.removeFunction(pipelineFunction);
    this.deleteModal = false;
  };

  addOrEditModalCancel() {
    this.addFunction = false;
    this.editFunction = false;
    this.noNewFunction = false;
    this.selectedStep = null;
    this.addAfterFunction = null;
  };
  addOrEditModalOk() {
    if (this.newFunction == null) { this.noNewFunction = true; }
    else {
      if (this.addFunction) { this.pipeline.addAfter(this.addAfterFunction, this.newFunction); }

      this.addFunction = false;
      this.editFunction = false;
      this.noNewFunction = false;
    }
  }

}


