import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CompleterService, CompleterData } from 'ng2-completer';

import * as transformationDataModel from '../../../../../assets/transformationdatamodel.js';


@Component({
  selector: 'split-columns',
  templateUrl: './split-columns.component.html',
  styleUrls: ['./split-columns.component.css']
})

export class SplitColumnsComponent implements OnInit {

  @Input() modalEnabled;
  @Output() emitter = new EventEmitter();
  private function: any;
  // TODO: Pass column names of the uploaded dataset
  //@Input() columns: String[] = [];
  private columns: String[] = ["ColumnName1", "ColumnName2", "ColumnName3", "zzz", "aaa", "qqq"];
  private colName: any = { id: 0, value: "" };
  private separator: String;

  private docstring: String;

  constructor() {
    if (!this.function) {
      this.function = new transformationDataModel.SplitFunction(
        this.colName, this.separator, this.docstring);
    }
    else {
      this.colName = this.function.colName;
      this.separator = this.function.separator;
      this.docstring = this.function.docstring;

    }
  }

  ngOnInit() {
    this.modalEnabled = false;
  }

  accept() {
    this.function.colName = this.colName;
    this.function.separator = this.separator;
    this.function.docstring = this.docstring;

    this.modalEnabled = false;
  }

  cancel() {
    this.modalEnabled = false;
  }

}
