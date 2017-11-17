import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

import * as transformationDataModel from '../../../../../assets/transformationdatamodel.js';

@Component({
  selector: 'make-dataset',
  templateUrl: './make-dataset.component.html',
  styleUrls: ['./make-dataset.component.css'],
  providers: []
})
export class MakeDatasetComponent implements OnInit {

  @Input() modalEnabled;
  @Input() private function: any;
  @Output() emitter = new EventEmitter();
  private makedatasetmode: String = '';
  private columnsArray: any = [];
  private useLazy: boolean;
  private moveFirstRowToHeader: boolean;
  private numberOfColumns: Number = 0;
  private docstring: String = '';

  constructor() {
    if (!this.function) {
      this.function = new transformationDataModel.MakeDatasetFunction(
        [], null, undefined, null, null);
    }
    else {
      this.columnsArray = this.function.columnsArray;
      this.useLazy = this.function.useLazy;
      this.numberOfColumns = this.function.numberOfColumns;
      this.moveFirstRowToHeader = this.function.moveFirstRowToHeader;
      this.docstring = this.function.docstring;
    }
  }

  ngOnInit() { }

  accept() {
    switch (this.makedatasetmode) {
      case 'colnames': {
        this.function.columnsArray = this.columnsArray;
        this.function.useLazy = true;
        this.function.numberOfColumns;
        this.function.moveFirstRowToHeader = false;
        this.function.docstring = this.docstring;
        break;
      }
      case 'ncolumns': {
        this.function.columnsArray = this.columnsArray;
        this.function.useLazy = true;
        this.function.numberOfColumns;
        this.function.moveFirstRowToHeader = false;
        this.function.docstring = this.docstring;
        break;
      }
      case 'firstrow': {
        this.function.columnsArray = this.columnsArray;
        this.function.useLazy = false;
        this.function.numberOfColumns;
        this.function.moveFirstRowToHeader = true;
        this.function.docstring = this.docstring;
        break;
      }
    }
    this.emitter.emit(this.function);
    console.log(this.columnsArray);
    this.modalEnabled = false;
  }

  cancel() {
    this.modalEnabled = false;
  }

}
