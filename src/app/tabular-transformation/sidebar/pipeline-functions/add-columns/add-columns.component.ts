import { Component, EventEmitter, Input, Output, OnInit, DoCheck, KeyValueChangeRecord, KeyValueDiffer, KeyValueDiffers, OnChanges, SimpleChange } from '@angular/core';
// import { PipelineFunction } from './pipelineFunction';
import { AddColumnsFunction, NewColumnSpec } from "../../../../../assets/transformationdatamodel.js";

@Component({
  selector: 'add-columns',
  templateUrl: './add-columns.component.html',
  styleUrls: ['./add-columns.component.css']
})
export class AddColumnsComponent implements OnInit, OnChanges {

  @Input() modalEnabled;
  @Input() function: any;
  //expression or value specification per column
  public addcolumnsmode: string[];

  //function parapeters 
  private columnsArray;
  private docstring: String;

  constructor() { }

  ngOnInit() {
    if (!this.function) {
      this.columnsArray = [new NewColumnSpec("", "", "", "")];
      this.addcolumnsmode = ['text'];
    }
    else {
      this.columnsArray = this.function.columnsArray;
      var i = 0;
      for (let newCol of this.columnsArray) {
        if (newCol.colValue) { this.addcolumnsmode[i] = 'text' }
        else { this.addcolumnsmode[i] = 'expr' }
        ++i;
      }
    }
  };

  ngOnChanges() {

  };

  addColumn() {
    var newColSpec = new NewColumnSpec("", "", "", "");
    this.columnsArray.push(newColSpec);
    this.addcolumnsmode.push('text');
  }
  removeColumn(idx: number) {
    if (this.columnsArray.length > 1) {
      this.columnsArray.splice(idx, 1);
      this.addcolumnsmode.splice(idx, 1);
    }
  }
  modeChange(idx: number) {
    if (this.addcolumnsmode[idx] == "text") {
      this.columnsArray[idx].specValue = null;
    }
    else {
      this.columnsArray[idx].colValue = null;
    }
  }

  accept() {
    if (!this.function) {
      this.function = new AddColumnsFunction([], null);
    }
    this.function.columnsArray = this.columnsArray;
    this.function.docstring = this.docstring;
    console.log(this.function);
    this.modalEnabled = false;
  }

  cancel() {
    this.modalEnabled = false;
  }

}