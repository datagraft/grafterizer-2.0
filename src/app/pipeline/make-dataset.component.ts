import { Component, Input, OnInit } from '@angular/core';
import { PipelineFunction } from './pipelineFunction';
import {Pipeline,MakeDatasetFunction} from "../transformation-data-model.service"; 


@Component({
  selector: 'make-dataset',
  templateUrl: './make-dataset.component.html',
  styleUrls: ['./make-dataset.component.css']
})
export class MakeDatasetComponent implements OnInit {
  @Input() function: MakeDatasetFunction;
  
  constructor() { }

  ngOnInit() {
    if (!this.function) {
    console.log("no function");}
    else 
    {
    console.log(this.function);}
  }

}
