import { Component, OnInit, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { TransformationService } from '../../../../transformation.service';

import * as transformationDataModel from '../../../../../assets/transformationdatamodel.js';


@Component({
  selector: 'take-rows',
  templateUrl: './take-rows.component.html',
  styleUrls: ['./take-rows.component.css']
})

export class TakeRowsComponent implements OnInit {

  @Input() private modalEnabled;
  @Input() private function: any;
  @Output() private emitter = new EventEmitter();
  private indexFrom: Number = 0;
  private indexTo: Number = 0;
  private take: boolean = true;
  private docstring: String;

  constructor() { }

  ngOnChanges() {
    this.modalEnabled = true;
    if (this.modalEnabled && this.function) {
      this.indexFrom = this.function.indexFrom;
      this.indexTo = this.function.indexTo;
      this.take = this.function.take;
      this.docstring = this.function.docstring;
    };
  }

  ngOnInit() {
    this.function = new transformationDataModel.DropRowsFunction(
      this.indexFrom, this.indexTo, this.take, this.docstring);
    this.modalEnabled = false;
  }

  accept() {
    this.function.indexFrom = this.indexFrom;
    this.function.indexTo = this.indexTo;
    this.function.take = this.take;
    this.function.docstring = this.docstring;
    this.emitter.emit(this.function);
    debugger
    this.modalEnabled = false;
  }

  cancel() {
    this.modalEnabled = false;
  }

}
