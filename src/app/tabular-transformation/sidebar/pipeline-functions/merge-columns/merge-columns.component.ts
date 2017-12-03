import { Component, OnInit, Input, Output, OnChanges, SimpleChanges, EventEmitter } from '@angular/core';

import * as transformationDataModel from '../../../../../assets/transformationdatamodel.js';


@Component({
  selector: 'merge-columns',
  templateUrl: './merge-columns.component.html',
  styleUrls: ['./merge-columns.component.css']
})

export class MergeColumnsComponent implements OnInit, OnChanges {

  @Input() modalEnabled;
  @Input() private function: any;
  @Input() defaultParams;
  @Output() emitter = new EventEmitter();
  // TODO: Pass column names of the uploaded dataset
  //@Input() columns: String[] = [];
  private columns: String[] = ["ColumnName1", "ColumnName2", "ColumnName3"];
  private colsToMerge: any = [];
  private separator: String;
  private newColName: String;
  private docstring: String;

  constructor() {
    if (!this.function) {
      this.function = new transformationDataModel.MergeColumnsFunction(this.colsToMerge, this.separator, this.newColName, this.docstring);
    }
    else {
      this.colsToMerge = this.function.colsToMerge;
      this.separator = this.function.separator;
      this.newColName = this.function.newColName;
      this.docstring = this.function.docstring;

    }
  }

  ngOnInit() {
    this.modalEnabled = false;
  }

  ngOnChanges(changes: SimpleChanges) {

    if (changes.defaultParams && this.defaultParams) {
      if (this.defaultParams.colsToMerge) {

        this.colsToMerge = this.defaultParams.colsToMerge;
      }

    }
  }

  accept() {
    this.function.colsToMerge = this.colsToMerge;
    this.function.separator = this.separator;
    this.function.newColName = this.newColName;
    this.function.docstring = this.docstring;
    this.emitter.emit(this.function);
    this.modalEnabled = false;
  }

  cancel() {
    this.modalEnabled = false;
  }

}
