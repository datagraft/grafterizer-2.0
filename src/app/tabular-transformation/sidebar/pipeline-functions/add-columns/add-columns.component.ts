import { Component, OnInit, Input, Output, OnChanges, SimpleChanges, EventEmitter } from '@angular/core';
import { CompleterService, CompleterData } from 'ng2-completer';

import * as transformationDataModel from '../../../../../assets/transformationdatamodel.js';


@Component({
  selector: 'add-columns',
  templateUrl: './add-columns.component.html',
  styleUrls: ['./add-columns.component.css']
})

export class AddColumnsComponent implements OnInit, OnChanges {

  @Input() modalEnabled;
  @Input() function: any;
  @Output() emitter = new EventEmitter();

  private addcolumnsmode: String[] = [];
  private columnsArray: any[];
  private docstring: String;

  constructor(private completerService: CompleterService) { }

  ngOnInit() {
    this.modalEnabled = false;
    this.initFunction();
  }

  initFunction() {
    this.docstring = '';
    this.columnsArray = [new transformationDataModel.NewColumnSpec(null, null, null, null)];
    this.function = new transformationDataModel.AddColumnsFunction(this.columnsArray, this.docstring);
    this.addcolumnsmode = ['text'];
  }

  addColumn() {
    var newColSpec = new transformationDataModel.NewColumnSpec("", "", "", "");
    this.columnsArray.push(newColSpec);
  }

  removeColumn(idx: number) {
    this.columnsArray.splice(idx, 1);
    this.addcolumnsmode.splice(idx, 1);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.function) {
      if (!this.function) {
        console.log('New function');
      }
      else {
        console.log('Edit function');
        if (this.function.__type == 'AddColumnsFunction') {
          this.columnsArray = this.function.columnsArray;
          for (let colVal of this.function.columnsArray) {
            if (colVal.colValue) { this.addcolumnsmode.push('text'); }
            else { this.addcolumnsmode.push('expr'); }
          }
          this.docstring = this.function.docstring;
        }
      }
    }
  }

  accept() {
    console.log(this.function);
    this.function.columnsArray = this.columnsArray;
    this.function.docstring = this.docstring;
    this.emitter.emit(this.function);
    this.initFunction();
    this.modalEnabled = false;
  }

  cancel() { this.modalEnabled = false; }

}
