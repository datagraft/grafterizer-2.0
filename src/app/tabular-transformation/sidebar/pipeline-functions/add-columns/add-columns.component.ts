import { Component, OnInit, Input } from '@angular/core';
import { CompleterService, CompleterData } from 'ng2-completer';

import * as transformationDataModel from '../../../../../assets/transformationdatamodel.js';


@Component({
  selector: 'add-columns',
  templateUrl: './add-columns.component.html',
  styleUrls: ['./add-columns.component.css']
})

export class AddColumnsComponent implements OnInit {

  @Input() modalEnabled;
  @Input() function: any;

  private addcolumnsmode: String[] = [];
  private columnsArray: any[];
  private docstring: String;



  constructor(private completerService: CompleterService) {
    //TODO: remove when passing transformation is implemented

    if (!this.function) {
      this.columnsArray = [new transformationDataModel.NewColumnSpec(null, null, null, null)];
      this.function = new transformationDataModel.AddColumnsFunction(this.columnsArray, this.docstring);
      this.addcolumnsmode = ['text'];
    }
    else {
      this.columnsArray = this.function.columnsArray;

      for (let colVal of this.function.columnsArray) {
        if (colVal.colValue) { this.addcolumnsmode.push('text'); }
        else { this.addcolumnsmode.push('expr'); }
      }
      this.docstring = this.function.docstring;

    }
  }

  ngOnInit() {
    this.modalEnabled = false;

  }

  addColumn() {
    var newColSpec = new transformationDataModel.NewColumnSpec("", "", "", "");
    this.columnsArray.push(newColSpec);
  }
  removeColumn(idx: number) {
    this.columnsArray.splice(idx, 1);
    this.addcolumnsmode.splice(idx, 1);
  }


  accept() {
    this.function.columnsArray = this.columnsArray;

    this.function.docstring = this.docstring;

    this.modalEnabled = false;
  }


  cancel() {
    this.modalEnabled = false;
  }

}
