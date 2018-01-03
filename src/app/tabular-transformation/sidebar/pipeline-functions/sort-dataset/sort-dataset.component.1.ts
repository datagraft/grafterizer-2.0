import { Component, OnInit, Input, Output, OnChanges, SimpleChanges, EventEmitter } from '@angular/core';
import { CompleterService, CompleterData } from 'ng2-completer';
import * as transformationDataModel from '../../../../../assets/transformationdatamodel.js';

@Component({
  selector: 'sort-dataset',
  templateUrl: './sort-dataset.component.html',
  styleUrls: ['./sort-dataset.component.css']
})

export class SortDatasetComponent implements OnInit, OnChanges {

  @Input() modalEnabled;
  @Input() function: any;
  @Input() defaultParams;
  @Input() columns: String[];
  @Output() emitter = new EventEmitter();
  private sortTypes: String[];
  private colnamesSorttypesMap: any[];
  private colnameSorttype: any;
  private colname: any;
  private docstring: String;

  constructor() { }

  ngOnInit() {
    this.modalEnabled = false;
    this.docstring = null;
    this.sortTypes = ["Alphabetical", "Numerical", "By length", "Date"];
    this.colnamesSorttypesMap = [];
    this.colname = { id: 0, value: 'gender' };
    this.colnameSorttype = new transformationDataModel.ColnameSorttype(this.colname, this.sortTypes[0], false);
    this.colnamesSorttypesMap.push(this.colnameSorttype);
    this.function = new transformationDataModel.SortDatasetFunction(
      this.colnamesSorttypesMap, this.docstring);
  }

  addColnameSorttype() {
    this.colnamesSorttypesMap.push(new transformationDataModel.ColnameSorttype(null, null, false));
  }

  removeSorting(idx: number) {
    this.colnamesSorttypesMap.splice(idx, 1);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.defaultParams && this.defaultParams) {
      if (this.defaultParams.colsToSort) {
        this.colnamesSorttypesMap = [];
        for (let colname of this.defaultParams.colsToSort) {
          this.colnamesSorttypesMap.push(new transformationDataModel.ColnameSorttype(colname, "", false));
        }
      }
    }
  }

  accept() {
    this.function.docstring = this.docstring;
    this.emitter.emit(this.function);
    this.modalEnabled = false;
  }

  cancel() { this.modalEnabled = false; }

}
