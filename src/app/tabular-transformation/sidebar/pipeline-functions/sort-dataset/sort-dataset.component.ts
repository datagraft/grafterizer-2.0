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
  @Output() emitter = new EventEmitter();
  @Input() defaultParams;

  // TODO: Pass column names of the uploaded dataset
  @Input() columns: String[] = [];
  private sortTypes: String[] = ["Alphabetical", "Numerical", "By length", "Date"];
  private sortings: any[] = [];


  private docstring: String;

  constructor() {
    if (!this.function) {
      this.sortings = [new transformationDataModel.ColnameSorttype("", "", false)];
      this.function = new transformationDataModel.SortDatasetFunction(
        this.sortings, this.docstring);
    }
    else {
      for (let sorting in this.function.colnamesSorttypesMap) {
        this.sortings.push(sorting);
      }
    }
  }

  ngOnInit() {
    this.modalEnabled = false;
  }

  addColnameSorttype() {
    this.sortings.push(new transformationDataModel.ColnameSorttype("", "", false));
  }

  removeSorting(idx: number) {
    this.sortings.splice(idx, 1);
  }

  ngOnChanges(changes: SimpleChanges) {

    if (changes.defaultParams && this.defaultParams) {
      if (this.defaultParams.colsToSort) {

        this.sortings = [];
        for (let colname of this.defaultParams.colsToSort) {
          this.sortings.push(new transformationDataModel.ColnameSorttype(colname, "", false));
        }
      }

    }
  }
  accept() {
    for (let sorting in this.function.sortings) {
      this.function.colnamesSorttypesMap.push(sorting);
    }
    this.function.docstring = this.docstring;
    this.emitter.emit(this.function);
    this.modalEnabled = false;
  }

  cancel() {
    this.modalEnabled = false;
  }

}
