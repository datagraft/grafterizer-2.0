import { Component, OnInit, Input } from '@angular/core';

import * as transformationDataModel from '../../../../../assets/transformationdatamodel.js';

@Component({
  selector: 'make-dataset',
  templateUrl: './make-dataset.component.html',
  styleUrls: ['./make-dataset.component.css']
})
export class MakeDatasetComponent implements OnInit {

  @Input() modalEnabled;
  private tdm: any;
  private makedatasetmode: String = "";
  private columnsArray: any = [];
  private numberOfColumns: Number = 0;
  private docstring: String;

  constructor() {
    this.tdm = new transformationDataModel.MakeDatasetFunction(
      [], null, 0, null, null);
  }

  ngOnInit() {
    this.modalEnabled = false;
  }

  accept() {
    switch (this.makedatasetmode) {
      case 'colnames': {
        this.tdm.columnsArray = this.columnsArray;
        this.tdm.useLazy = false;
        this.tdm.numberOfColumns
        this.tdm.moveFirstRowToHeader = false;
        this.tdm.docstring = this.docstring;
        break;
      }
      case 'ncolumns': {
        this.tdm.columnsArray = this.columnsArray;
        this.tdm.useLazy = true;
        this.tdm.numberOfColumns
        this.tdm.moveFirstRowToHeader = false;
        this.tdm.docstring = this.docstring;
        break;
      }
      case 'firstrow': {
        this.tdm.columnsArray = this.columnsArray;
        this.tdm.useLazy = false;
        this.tdm.numberOfColumns
        this.tdm.moveFirstRowToHeader = true;
        this.tdm.docstring = this.docstring;
        break;
      }
    }
    console.log(this.tdm);
    this.modalEnabled = false;
  }

  cancel() {
    this.modalEnabled = false;
  }

}
