import { Component, OnInit, Input, Output, OnChanges, SimpleChanges, EventEmitter } from '@angular/core';

import * as transformationDataModel from '../../../../../assets/transformationdatamodel.js';


@Component({
  selector: 'merge-columns',
  templateUrl: './merge-columns.component.html',
  styleUrls: ['./merge-columns.component.css']
})

export class MergeColumnsComponent implements OnInit, OnChanges {

  @Input() function: any;
  @Input() modalEnabled: boolean;
  @Input() defaultParams;
  @Input() columns: String[];
  @Output() emitter = new EventEmitter();
  private colsToMerge: any;
  private separator: String;
  private newColName: String;
  private docstring: String;

  constructor() { }

  ngOnInit() {
    this.modalEnabled = false;
    this.initFunction();
  }

  initFunction() {
    this.colsToMerge = [];
    this.separator = null;
    this.newColName = null;
    this.docstring = null;
    this.function = new transformationDataModel.MergeColumnsFunction(this.colsToMerge, this.separator, this.newColName, this.docstring);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.function) {
      if (!this.function) {
        // console.log('New function');
      }
      else {
        console.log('Edit function');
        if (this.function.__type == 'MergeColumnsFunction') {
          this.colsToMerge = this.function.colsToMerge;
          this.separator = this.function.separator;
          this.newColName = this.function.newColName;
          this.docstring = this.function.docstring;
        }
      }
    }
    if (changes.defaultParams && this.defaultParams) {
      console.log('OK');
      if (this.defaultParams.colsToMerge) {
        // this.colsToMerge = this.defaultParams.colsToMerge;
      }
    }
  }

  accept() {
    console.log(this.function);
    console.log(this.colsToMerge);
    this.function.colsToMerge = this.colsToMerge;
    this.function.separator = this.separator;
    this.function.newColName = this.newColName;
    this.function.docstring = this.docstring;
    this.emitter.emit(this.function);
    this.initFunction();
    this.modalEnabled = false;
  }

  cancel() { this.modalEnabled = false; }

}
