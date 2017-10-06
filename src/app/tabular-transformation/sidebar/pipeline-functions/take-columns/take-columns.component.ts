import { Component, OnInit, Input } from '@angular/core';

import * as transformationDataModel from '../../../../../assets/transformationdatamodel.js';


@Component({
  selector: 'take-columns',
  templateUrl: './take-columns.component.html',
  styleUrls: ['./take-columns.component.css']
})

export class TakeColumnsComponent implements OnInit {

  @Input() modalEnabled;
  @Input() function: any;
  // TODO: Pass column names of the uploaded dataset
  //@Input() columns: String[] = [];
  private columns: String[] = ["ColumnName1", "ColumnName2", "ColumnName3"];
  private takecolumnsmode: String = "";
  private indexFrom: Number = null;
  private indexTo: Number = null;
  private columnsArray: any = [];
  private take: boolean = true;
  private docstring: String;

  constructor() {
    if (!this.function) {
      this.function = new transformationDataModel.ColumnsFunction(this.columnsArray,
        this.indexFrom, this.indexTo, this.take, this.docstring);
    }
    else {
      this.columnsArray = this.function.columnsArray;
      this.indexFrom = this.function.indexFrom;
      this.indexTo = this.function.indexTo;
      this.take = this.function.take;
      this.docstring = this.function.docstring;

    }
  }

  ngOnInit() {
    this.modalEnabled = false;
  }

  accept() {
    this.function.columnsArray = this.columnsArray;
    this.function.indexFrom = this.indexFrom;
    this.function.indexTo = this.indexTo;
    this.function.take = this.take;
    this.function.docstring = this.docstring;

    this.modalEnabled = false;
  }

  cancel() {
    this.modalEnabled = false;
  }

}
