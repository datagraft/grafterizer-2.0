import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

import * as transformationDataModel from '../../../../../assets/transformationdatamodel.js';


@Component({
  selector: 'take-rows',
  templateUrl: './take-rows.component.html',
  styleUrls: ['./take-rows.component.css']
})

export class TakeRowsComponent implements OnInit {

  @Input() modalEnabled;
  @Output() emitter = new EventEmitter();
  private function: any;
  private indexFrom: Number = 0;
  private indexTo: Number = 0;
  private take: boolean = true;
  private docstring: String;

  constructor() {
    if (!this.function) {
      this.function = new transformationDataModel.DropRowsFunction(
        this.indexFrom, this.indexTo, this.take, this.docstring);
    }
    else {
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
    this.function.indexFrom = this.indexFrom;
    this.function.indexTo = this.indexTo;
    this.function.take = this.take;
    this.function.docstring = this.docstring;

    console.log('Take-rows:');
    console.log(this.function);
    this.emitter.emit(this.function);
    this.modalEnabled = false;
  }

  cancel() {
    this.modalEnabled = false;
  }

}
