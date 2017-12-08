import { Component, OnInit, Input, Output, OnChanges, SimpleChanges, EventEmitter } from '@angular/core';
import { CompleterService, CompleterData, CompleterItem } from 'ng2-completer';

import * as transformationDataModel from '../../../../../assets/transformationdatamodel.js';
//TODO: remove when passing transformation is implemented
import * as data from '../../../../../assets/data.json';
@Component({
  selector: 'derive-column',
  templateUrl: './derive-column.component.html',
  styleUrls: ['./derive-column.component.css']
})
export class DeriveColumnComponent implements OnInit, OnChanges {

  @Input() modalEnabled;
  @Input() function: any;
  @Output() emitter = new EventEmitter();
  // TODO: Pass column names of the uploaded dataset
  @Input() columns: String[] = [];
  // Transformation is needed to search for prefixers/functions
  @Input() transformation: any;
  private tr1: any;
  //private columns: String[] = ["ColumnName1", "ColumnName2", "ColumnName3"];

  private newColName: String;
  private colsToDeriveFrom: any = [];

  private deriveFunctions: any[] = []; // type customFunctionDeclaration

  private params: any[] = [[]];
  private docstring: String;

  private dataService: CompleterData;
  private functionNames: any[] = [];

  constructor() {
  }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.transformation) {


      //this.dataService = this.completerService.local(this.transformation.customFunctionDeclarations, 'name', 'name');
      for (let f of this.transformation.customFunctionDeclarations) {
        this.functionNames.push(f.name);
      }

    }
    if (changes.function) {
      if (!this.function) {
        this.deriveFunctions = [undefined]
        this.function = new transformationDataModel.DeriveColumnFunction(this.newColName, this.colsToDeriveFrom, [new transformationDataModel.FunctionWithArgs(null, [])], this.docstring);
      }
      else {
        console.log(this.function);
        console.log(this.transformation);
        this.newColName = this.function.newColName;
        this.colsToDeriveFrom = this.function.colsToDeriveFrom.map(o => o.value);
        //this.functionsToDeriveWith = this.function.functionsToDeriveWith;
        this.deriveFunctions = [];
        this.params = [[]];
        for (let availableFunction of this.function.functionsToDeriveWith) {
          this.deriveFunctions.push(availableFunction.funct.name);
          this.params.push(availableFunction.functParams);
        }
        this.docstring = this.function.docstring;
        console.log(this.deriveFunctions);
      }
    }
  }

  findCustomFunctionByName(transformation, name) {
    for (let f of transformation.customFunctionDeclarations) {
      if (f.name == name)
        return f;
    }
  }

  accept() {
    this.function.newColName = this.newColName;
    this.function.colsToDeriveFrom = [];
    for (let i = 0; i < this.colsToDeriveFrom.length; ++i) {
      this.function.colsToDeriveFrom.push({ id: 0, value: this.colsToDeriveFrom[i] });
    }
    //this.function.colsToDeriveFrom = this.colsToDeriveFrom;
    this.function.functionsToDeriveWith = [];

    for (let i = 0; i < this.deriveFunctions.length; ++i) {
      let cf = this.findCustomFunctionByName(this.transformation, this.deriveFunctions[i]);
      this.function.functionsToDeriveWith.push(new transformationDataModel.FunctionWithArgs(cf, this.params[i]));
    }
    this.function.docstring = this.docstring;
    this.emitter.emit(this.function);
    this.modalEnabled = false;
    console.log(this.function);
  }

  reduceFunctionParams(idx) {
    //var params = this.findCustomFunctionByName(this.transformation, this.deriveFunctions[idx]).getParams();
    var params = [];
    var f = this.findCustomFunctionByName(this.transformation, this.deriveFunctions[idx]);
    if (!f) return params;
    if (!f.hasOwnProperty('clojureCode')) return params;
    if (!f.clojureCode) return params;
    var d = f.clojureCode.match(/\[(.*?)\]/g);
    if (d) {
      d[0] = d[0].replace(/^\[|\]$/g, '');
      params = d[0].split(" ");
      params.splice(0, 1);
    }
    for (let i of this.colsToDeriveFrom.length) {
      params.splice(0, 1);
    }
    return params;
  }

  onFunctionSelected(selected: CompleterItem, idx) { }

  addDeriveFunction() {
    this.deriveFunctions.push(undefined);
    this.params.push([]);
  }

  removeFunction(idx) {
    console.log(this.deriveFunctions[idx]);
    this.deriveFunctions.splice(idx, 1);
    // this.functionsToDeriveWith.splice(idx, 1);
    this.params.splice(idx, 1);
    //this.deriveFunctions = this.functionsToDeriveWith.slice();
  }

  cancel() { this.modalEnabled = false; }

}
