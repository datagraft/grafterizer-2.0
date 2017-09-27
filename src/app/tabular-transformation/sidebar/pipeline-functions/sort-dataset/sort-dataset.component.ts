import { Component, OnInit, Input } from '@angular/core';
import { CompleterService, CompleterData } from 'ng2-completer';

import * as transformationDataModel from '../../../../../assets/transformationdatamodel.js';


@Component({
  selector: 'sort-dataset',
  templateUrl: './sort-dataset.component.html',
  styleUrls: ['./sort-dataset.component.css']
})

export class SortDatasetComponent implements OnInit {

  @Input() modalEnabled;
  @Input() function: any;
  // TODO: Pass column names of the uploaded dataset
  //@Input() columns: String[] = [];
  private columns: String[] = ["ColumnName1", "ColumnName2", "ColumnName3", "zzz", "aaa", "qqq"];
  private sortTypes: String[] = ["Alphabetical", "Numerical", "By length", "Date"];
  private sortings: any[] = [];


  private docstring: String;

  constructor() {
    if (!this.function) {
      console.log("!function ");
      this.sortings = [new transformationDataModel.ColnameSorttype("", "", false)];
      this.function = new transformationDataModel.SortDatasetFunction(
        this.sortings, this.docstring);
      console.log(this.sortings);
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
  accept() {
    for (let sorting in this.function.sortings) {
      this.function.colnamesSorttypesMap.push(sorting);
    }
    this.function.docstring = this.docstring;
  }

  cancel() {
    this.modalEnabled = false;
  }

}
