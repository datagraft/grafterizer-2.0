import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';

import * as transformationDataModel from '../../../../../assets/transformationdatamodel.js';


@Component({
  selector: 'take-columns',
  templateUrl: './take-columns.component.html',
  styleUrls: ['./take-columns.component.css']
})

export class TakeColumnsComponent implements OnInit {

  @Input() function: any;
  @Input() modalEnabled;
  @Output() emitter = new EventEmitter();

  private columns: String[] = ["ColumnName1", "ColumnName2", "ColumnName3"];
  private takecolumnsmode: String;
  private indexFrom: Number;
  private indexTo: Number;
  private columnsArray: any;
  private take: boolean;
  private docstring: String;

  constructor() { }

  ngOnInit() {
    this.modalEnabled = false;
    this.initFunction();
  }

  initFunction() {
    this.columnsArray = [];
    this.indexFrom = 0;
    this.indexTo = 0;
    this.take = true;
    this.docstring = null;
    this.function = new transformationDataModel.ColumnsFunction(this.columnsArray,
      this.indexFrom, this.indexTo, this.take, this.docstring);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.function) {
      if (!this.function) {
        console.log('New function');
      }
      else {
        console.log('Edit function');
        if (this.function.__type == 'ColumnsFunction') {
          this.columnsArray = this.function.columnsArray;
          this.indexFrom = this.function.indexFrom;
          this.indexTo = this.function.indexTo;
          this.take = this.function.take;
          this.docstring = this.function.docstring;
        }
      }
    }
  }

  accept() {
    this.function.columnsArray = this.columnsArray;
    this.function.indexFrom = this.indexFrom;
    this.function.indexTo = this.indexTo;
    this.function.take = this.take;
    this.function.docstring = this.docstring;
    this.emitter.emit(this.function);
    this.modalEnabled = false;
  }

  cancel() { this.modalEnabled = false; }

}
