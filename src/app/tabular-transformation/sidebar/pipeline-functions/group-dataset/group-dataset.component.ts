import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CompleterService, CompleterData } from "ng2-completer";

import * as transformationDataModel from "../../../../../assets/transformationdatamodel.js";


@Component({
  selector: "group-dataset",
  templateUrl: "./group-dataset.component.html",
  styleUrls: ["./group-dataset.component.css"]
})

export class GroupDatasetComponent implements OnInit {

  @Input() modalEnabled;
  @Output() emitter = new EventEmitter();
  private function: any;
  // TODO: Pass column names of the uploaded dataset
  //@Input() columns: String[] = [];
  private columns: String[] = ["ColumnName1", "ColumnName2", "ColumnName3", "zzz", "aaa", "qqq"];
  private aggrTypes: String[] = ["MIN", "MAX", "SUM", "COUNT", "COUNT-DISTINCT", "AVG", "MERGE"];
  private colnames: String[];
  private colnamesFunctionsSet: String[];
  private separatorSet: any[];

  private docstring: String;

  constructor() {
    if (!this.function) {
      this.colnames = [];
      this.colnamesFunctionsSet = [null, null];
      this.separatorSet = [null];

      this.function = new transformationDataModel.GroupRowsFunction(
        this.colnames, this.colnamesFunctionsSet, this.separatorSet, this.docstring);

    }

    else {
      this.colnames = this.function.colnames;
      this.colnamesFunctionsSet = this.function.colnamesFunctionsSet;
      this.separatorSet = this.function.separatorSet;
      this.docstring = this.function.docstring;

    }
  }

  ngOnInit() {
    this.modalEnabled = false;
  }

  addAggregation() {
    this.colnamesFunctionsSet.push(null, null);
    this.separatorSet.push(null, null);
  }

  removeAggregation(idx: number) {
    this.colnamesFunctionsSet.splice(idx, 2);
    this.separatorSet.splice(idx, 2);
  }
  getsetlength() {
    var b = [];
    for (var i = 0; i < this.colnamesFunctionsSet.length; i += 2) b.push(i);
    return b;
  }
  accept() {
    this.function.colnamesFunctionsSet = this.colnamesFunctionsSet;
    this.function.separatorSet = this.separatorSet;
    this.function.docstring = this.docstring;
    this.emitter.emit(this.function);
    this.modalEnabled = false;
  }

  cancel() {
    this.modalEnabled = false;
  }

}
