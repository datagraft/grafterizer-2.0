import { Component, OnInit, Input } from "@angular/core";
import { CompleterService, CompleterData } from "ng2-completer";

import * as transformationDataModel from "../../../../../assets/transformationdatamodel.js";


@Component({
  selector: "reshape-dataset",
  templateUrl: "./reshape-dataset.component.html",
  styleUrls: ["./reshape-dataset.component.css"]
})

export class ReshapeDatasetComponent implements OnInit {

  @Input() modalEnabled;
  @Input() function: any;
  // TODO: Pass column names of the uploaded dataset
  //@Input() columns: String[] = [];
  private columns: String[] = ["ColumnName1", "ColumnName2", "ColumnName3"];
  private aggrFunctions: String[] = ["MIN", "MAX", "SUM", "COUNT", "COUNT-DISTINCT", "AVG", "MERGE"];
  private columnsArray: any = [];
  private variable: String;
  private value: String;
  private aggrFunction: String;
  private separator: String;

  private docstring: String;
  private reshapedatasetmode: String;

  constructor() {
    if (!this.function) {
      this.function = new transformationDataModel.MeltFunction(
        this.columnsArray, this.variable, this.value, this.aggrFunction, this.separator, this.docstring);
    }
    else {
      this.columnsArray = this.function.columnsArray;
      this.variable = this.function.variable;
      this.value = this.function.value;
      this.aggrFunction = this.function.aggrFunction;
      this.separator = this.function.separator;
      this.docstring = this.function.docstring;

    }
  }

  ngOnInit() {
    this.modalEnabled = false;
  }

  accept() {
    this.function.columnsArray = this.columnsArray;
    this.function.variable = this.variable;
    this.function.value = this.value;
    this.function.aggrFunction = this.aggrFunction;
    this.function.separator = this.separator;
    this.function.docstring = this.docstring;

    this.modalEnabled = false;
  }

  cancel() {
    this.modalEnabled = false;
  }

}
