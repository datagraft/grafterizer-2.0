import { Component, OnInit, Input, Output, EventEmitter, OnChanges } from '@angular/core';

import * as transformationDataModel from '../../../../../assets/transformationdatamodel.js';

@Component({
  selector: 'make-dataset',
  templateUrl: './make-dataset.component.html',
  styleUrls: ['./make-dataset.component.css'],
  providers: []
})
export class MakeDatasetComponent implements OnInit, OnChanges {

  @Input() modalEnabled;

  @Output() emitter = new EventEmitter();
  @Input() function: any;
  @Input() params: any;
  private makedatasetmode: String = '';
  private columnsArray: any = [];
  private useLazy: boolean = false;
  private moveFirstRowToHeader: boolean;
  private numberOfColumns: Number = 0;
  private docstring: String = '';

  constructor() {


  }

  ngOnInit() {
  }

  ngOnChanges() {
    if (!this.function) {
      this.function = new transformationDataModel.MakeDatasetFunction(
        [], false, undefined, null, null);
    }
    else {
      this.columnsArray = this.function.columnsArray.map(o => o.value);
      this.useLazy = this.function.useLazy;
      this.numberOfColumns = this.function.numberOfColumns;
      this.moveFirstRowToHeader = this.function.moveFirstRowToHeader;
      this.docstring = this.function.docstring;
    }
  }

  accept() {
    switch (this.makedatasetmode) {
      case 'colnames': {
        this.function.columnsArray = [];
        for (let c of this.columnsArray) {
          this.function.columnsArray.push({ id: 0, value: c });
        }

        this.function.useLazy = false;
        this.function.numberOfColumns = this.numberOfColumns;
        this.function.moveFirstRowToHeader = false;
        this.function.docstring = this.docstring;
        break;
      }
      case 'ncolumns': {
        this.function.columnsArray = this.columnsArray;
        this.function.useLazy = true;
        this.function.numberOfColumns = this.numberOfColumns;
        this.function.moveFirstRowToHeader = false;
        this.function.docstring = this.docstring;
        break;
      }
      case 'firstrow': {
        this.function.columnsArray = this.columnsArray;
        this.function.useLazy = false;
        this.function.numberOfColumns = this.numberOfColumns;
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
