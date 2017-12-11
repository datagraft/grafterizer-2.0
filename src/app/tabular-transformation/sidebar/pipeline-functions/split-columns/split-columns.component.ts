import { Component, OnInit, Input, Output, OnChanges, SimpleChanges, EventEmitter } from '@angular/core';
import { CompleterService, CompleterData } from 'ng2-completer';
import * as transformationDataModel from '../../../../../assets/transformationdatamodel.js';

@Component({
  selector: 'split-columns',
  templateUrl: './split-columns.component.html',
  styleUrls: ['./split-columns.component.css']
})

export class SplitColumnsComponent implements OnInit, OnChanges {

  @Input() function: any;
  @Input() modalEnabled;
  @Input() defaultParams;
  @Output() emitter = new EventEmitter();
  // TODO: Pass column names of the uploaded dataset
  //@Input() columns: String[] = [];
  private columns: String[];
  private colName: any;
  private separator: String;
  private docstring: String;

  constructor() { }

  ngOnInit() {
    this.modalEnabled = false;
    this.initFunction();
  }

  initFunction() {
    this.columns = ["county", "ColumnName2", "ColumnName3", "zzz", "aaa", "qqq"];
    this.colName = { id: 0, value: '' };
    this.separator = null;
    this.docstring = null;
    this.function = new transformationDataModel.SplitFunction(
      this.colName, this.separator, this.docstring);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.function) {
      if (!this.function) {
        console.log('New function');
      }
      else if (changes.defaultParams && this.defaultParams) {
        if (this.defaultParams.colToSplit) {
          this.colName = this.defaultParams.colToSplit;
        }
      }
      else {
        console.log('Edit function');
        if (this.function.__type == 'SplitFunction') {
          this.colName = this.function.colName;
          this.separator = this.function.separator;
          this.docstring = this.function.docstring;
        }
      }
    }
  }

  accept() {
    this.function.colName = this.colName;
    this.function.separator = this.separator;
    this.function.docstring = this.docstring;
    this.emitter.emit(this.function);
    this.initFunction();
    this.modalEnabled = false;
  }

  cancel() { this.modalEnabled = false; }

}
