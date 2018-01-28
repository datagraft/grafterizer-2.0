import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';

import * as transformationDataModel from '../../../../../assets/transformationdatamodel.js';

@Component({
  selector: 'make-dataset',
  templateUrl: './make-dataset.component.html',
  styleUrls: ['./make-dataset.component.css'],
  providers: []
})
export class MakeDatasetComponent implements OnInit, OnChanges {

  @Input() function: any;
  @Input() modalEnabled;
  @Input() params: any;
  @Output() emitter = new EventEmitter();

  private makedatasetmode: String = '';
  private columnsArray: any = [];
  private useLazy: boolean = false;
  private moveFirstRowToHeader: boolean;
  private numberOfColumns: Number = 0;
  private docstring: String = '';

  constructor() { }

  ngOnInit() {
    this.modalEnabled = false;
    this.initFunction();
  }

  initFunction() {
    this.function = new transformationDataModel.MakeDatasetFunction(
      null, null, null, null, null);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.function) {
      if (!this.function) {
        // console.log('New function');
      }
      else {
        console.log('Edit function');
        console.log(this.function)
        if (this.function.__type == 'MakeDatasetFunction') {
          this.columnsArray = this.function.columnsArray.map(o => o.value);
          this.useLazy = this.function.useLazy;
          this.numberOfColumns = this.function.numberOfColumns;
          this.moveFirstRowToHeader = this.function.moveFirstRowToHeader;
          if (this.moveFirstRowToHeader) {
            this.makedatasetmode = 'firstrow';
          }
          else { this.makedatasetmode = 'colnames' }
        }
        this.docstring = this.function.docstring;
      }
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
        this.function.columnsArray = [];
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
