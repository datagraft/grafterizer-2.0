import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CompleterService, CompleterData } from 'ng2-completer';

import * as transformationDataModel from '../../../../../assets/transformationdatamodel.js';


@Component({
  selector: 'shift-row',
  templateUrl: './shift-row.component.html',
  styleUrls: ['./shift-row.component.css']
})

export class ShiftRowComponent implements OnInit {

  @Input() modalEnabled;
  @Output() emitter = new EventEmitter();
  private function: any;
  // TODO: Pass column names of the uploaded dataset
  //@Input() columns: String[] = [];
  private indexFrom: Number;
  private indexTo: Number;
  private shiftrowmode: String;


  private docstring: String;

  constructor() {
    if (!this.function) {
      this.function = new transformationDataModel.ShiftRowFunction(
        this.indexFrom, this.indexTo, this.shiftrowmode, this.docstring);
    }
    else {
      this.indexFrom = this.function.indexFrom;
      this.indexTo = this.function.indexTo;
      this.shiftrowmode = this.function.shiftrowmode;
      this.docstring = this.function.docstring;

    }
  }

  ngOnInit() {
    this.modalEnabled = false;
  }

  accept() {
    this.function.indexFrom = this.indexFrom;
    this.function.indexTo = this.indexTo;
    this.function.shiftrowmode = this.shiftrowmode;
    this.function.docstring = this.docstring;
    this.emitter.emit(this.function);
    this.modalEnabled = false;
  }

  cancel() {
    this.modalEnabled = false;
  }

}
