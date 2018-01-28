import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CompleterService, CompleterData } from 'ng2-completer';
import * as transformationDataModel from '../../../../../assets/transformationdatamodel.js';

@Component({
  selector: 'filter-rows',
  templateUrl: './filter-rows.component.html',
  styleUrls: ['./filter-rows.component.css']
})

export class FilterRowsComponent implements OnInit, OnChanges {

  @Input() modalEnabled;
  @Input() function: any;
  @Input() defaultParams: any;
  @Input() transformation: any;
  @Input() columns: String[];
  @Output() emitter = new EventEmitter();
  private colsToFilter: String[];
  private filterText: String;
  private filterRegex: String;
  private ignoreCase: Boolean;
  private take: Boolean;
  private grepmode: String;
  private filterFunctionsNames: String[]; // functions to filter with
  private functionNames: String[]; // functions to select from
  private docstring: String;
  protected dataService: CompleterData;
  private renamecolumnsmode: String;

  constructor(private completerService: CompleterService) { }

  ngOnInit() {
    this.modalEnabled = false;
    this.initFunction();
  }

  initFunction() {
    this.columns = [];
    this.colsToFilter = [];
    this.functionNames = [];
    this.filterFunctionsNames = [null];
    this.ignoreCase = false;
    this.take = true;
    this.grepmode = "text";
    this.filterText = null;
    this.function = new transformationDataModel.GrepFunction(this.take, this.grepmode, this.colsToFilter, this.filterFunctionsNames, this.filterText, this.filterRegex, this.ignoreCase, this.docstring);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.function) {
      if (!this.function) {
        // console.log('New function');
      }
      else {
        console.log('Edit function');
        if (this.function.__type == 'GrepFunction') {
          this.take = this.function.take;
          this.grepmode = this.function.grepmode;
          this.colsToFilter = this.function.colsToFilter.map(o => o.value);
          this.filterFunctionsNames = this.function.functionsToFilterWith.map(o => o.name);
          this.filterText = this.function.filterText;
          this.filterRegex = this.function.filterRegex;
          this.ignoreCase = this.function.ignoreCase;
          this.docstring = this.function.docstring;
        }
      }
    }
    if (changes.transformation) {
      if (this.transformation) {
        for (let f of this.transformation.customFunctionDeclarations) {
          this.functionNames.push(f.name);
        }
      }
    }
    if (this.defaultParams && changes.defaultParams) {
      if (this.defaultParams.colsToFilter) {
        this.colsToFilter = this.defaultParams.colsToFilter;
      }
    }
  }

  addFilterFunction() {
    this.filterFunctionsNames.push(null);
  }

  removeFilterFunction(idx) {
    this.filterFunctionsNames.splice(idx, 1);
  }

  findCustomFunctionByName(transformation, name) {
    for (let f of transformation.customFunctionDeclarations) {
      if (f.name == name)
        return f;
    }
  }

  accept() {
    this.function.take = this.take;
    this.function.grepmode = this.grepmode;
    this.function.colsToFilter = [];
    for (let c of this.colsToFilter) {
      this.function.colsToFilter.push({ id: 0, value: c });
    }
    this.function.filterText = this.filterText;
    this.function.filterRegex = this.filterRegex;
    this.function.ignoreCase = this.ignoreCase;
    this.function.functionsToFilterWith = [];
    for (let filterFunctionsName of this.filterFunctionsNames) {
      let cf = this.findCustomFunctionByName(this.transformation, filterFunctionsName);
      this.function.functionsToFilterWith.push(cf);
    }
    this.function.docstring = this.docstring;
    this.emitter.emit(this.function);
    this.initFunction();
    this.modalEnabled = false;
  }

  cancel() { this.modalEnabled = false; }

}

