import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { TransformationService } from '../../../../transformation.service';
import * as transformationDataModel from '../../../../../assets/transformationdatamodel.js';

@Component({
  selector: 'take-rows',
  templateUrl: './take-rows.component.html',
  styleUrls: ['./take-rows.component.css']
})

export class TakeRowsComponent implements OnInit {

  @Input() private function: any;
  @Input() private modalEnabled;
  @Output() private emitter = new EventEmitter();

  private indexFrom: Number;
  private indexTo: Number;
  private take: boolean;
  private docstring: String;

  constructor() { }

  initFunction() {
    this.indexFrom = 0;
    this.indexTo = 0;
    this.take = true;
    this.docstring = null;
    this.function = new transformationDataModel.DropRowsFunction(
      this.indexFrom, this.indexTo, this.take, this.docstring);
  }

  ngOnInit() {
    this.modalEnabled = false;
    this.initFunction();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.function) {
      if (!this.function) {
        console.log('New function');
      }
      else {
        console.log('Edit function');
        if (this.function.__type == 'AddColumnsFunction') {
          this.indexFrom = this.function.indexFrom;
          this.indexTo = this.function.indexTo;
          this.take = this.function.take;
          this.docstring = this.function.docstring;
        }
      }
    }
  }

  accept() {
    this.function.indexFrom = this.indexFrom;
    this.function.indexTo = this.indexTo;
    this.function.take = this.take;
    this.function.docstring = this.docstring;
    this.emitter.emit(this.function);
    this.initFunction();
    this.modalEnabled = false;
  }

  cancel() { this.modalEnabled = false; }

}
