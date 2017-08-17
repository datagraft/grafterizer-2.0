import { Component, OnInit, Input } from '@angular/core';
import { PipelineFunction } from './pipelineFunction';

@Component({
  selector: 'pipeline-steps',
  templateUrl: './pipeline.component.html',
  styleUrls: ['./pipeline.component.css']
})
export class PipelineComponent implements OnInit {
  public addOrEditFunction: boolean = false;
  selectedStep: PipelineFunction;
  @Input() pipeline: PipelineFunction[];
  //TODO: pass the transformations
  @Input() transformation: string;

  constructor() { }


  ngOnInit() {
  };

  clickEditFunction(pipelineFunction: PipelineFunction): void {
    this.selectedStep = pipelineFunction;
    this.addOrEditFunction = true;

  }

   clickAddFunction(): void {
    this.addOrEditFunction = true;
    this.selectedStep = null;
  }
}
