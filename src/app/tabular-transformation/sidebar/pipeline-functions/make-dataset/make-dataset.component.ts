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
  private function: any;
  private makedatasetmode: String = '';
  private columnsArray: any = [];
  private numberOfColumns: Number = 0;
  private docstring: String = '';

  @Output() emitter = new EventEmitter();

  constructor() {
    this.function = new transformationDataModel.MakeDatasetFunction(
      [], null, 0, null, null);
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
    this.modalEnabled = false;
  }

  cancel() {
    this.modalEnabled = false;
  }

}
