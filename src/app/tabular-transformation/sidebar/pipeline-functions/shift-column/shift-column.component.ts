import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CompleterService, CompleterData } from 'ng2-completer';

import * as transformationDataModel from '../../../../../assets/transformationdatamodel.js';


@Component({
  selector: 'shift-column',
  templateUrl: './shift-column.component.html',
  styleUrls: ['./shift-column.component.css']
})

export class ShiftColumnComponent implements OnInit {

  @Input() modalEnabled;
  @Input() private function: any;
  @Output() emitter = new EventEmitter();
  // TODO: Pass column names of the uploaded dataset
  //@Input() columns: String[] = [];
  private colFrom: Number;
  private indexTo: Number;
  private shiftcolmode: String;
  private columns: String[] = ["ColumnName1", "ColumnName2", "ColumnName3", "zzz", "aaa", "qqq"];

  private docstring: String;

  constructor() {
    if (!this.function) {
      this.function = new transformationDataModel.ShiftColumnFunction(
        this.colFrom, this.indexTo, this.shiftcolmode, this.docstring);
    }
    else {
      this.colFrom = this.function.colFrom;
      this.indexTo = this.function.indexTo;
      this.shiftcolmode = this.function.shiftcolmode;
      this.docstring = this.function.docstring;

    }
  }

  ngOnInit() {
    this.modalEnabled = false;
  }

  accept() {
    this.function.colFrom = this.colFrom;
    this.function.indexTo = this.indexTo;
    this.function.shiftcolmode = this.shiftcolmode;
    this.function.docstring = this.docstring;
    this.emitter.emit(this.function);
    this.modalEnabled = false;
  }

  cancel() {
    this.modalEnabled = false;
  }

}
