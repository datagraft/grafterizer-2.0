import { Component, OnInit, Input, Output, OnChanges, SimpleChanges, EventEmitter } from '@angular/core';
import { CompleterService, CompleterData, CompleterItem } from 'ng2-completer';
import * as transformationDataModel from '../../../../../assets/transformationdatamodel.js';

@Component({
  selector: 'derive-column',
  templateUrl: './derive-column.component.html',
  styleUrls: ['./derive-column.component.css']
})

export class DeriveColumnComponent implements OnInit, OnChanges {

  @Input() function: any;
  @Input() modalEnabled;
  @Input() columns: String[];
  @Input() transformation: any;  // Transformation is needed to search for prefixers/functions  
  @Output() emitter = new EventEmitter();

  private tr1: any;
  private newColName: String;
  private colsToDeriveFrom: any;
  private deriveFunctions: any[]; // type customFunctionDeclaration
  private params: any[];
  private docstring: String;
  private dataService: CompleterData;
  private functionNames: any[];

  constructor() { }

  ngOnInit() {
    this.modalEnabled = false;
    this.initFunction();
  }

  initFunction() {
    this.newColName = null;
    this.colsToDeriveFrom = [];
    this.deriveFunctions = [];
    this.params = [[]];
    this.docstring = null;
    this.functionNames = [];
    this.function = new transformationDataModel.DeriveColumnFunction(this.newColName, this.colsToDeriveFrom, [new transformationDataModel.FunctionWithArgs(null, [])], this.docstring);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.transformation) {
      for (let f of this.transformation.customFunctionDeclarations) {
        this.functionNames.push(f.name);
      }
    }
    if (changes.function) {
      if (!this.function) {
        console.log('New function');
        this.deriveFunctions = [undefined];
      }
      else {
        console.log('Edit function');
        if (this.function.__type == 'DeriveColumnFunction') {
          this.newColName = this.function.newColName;
          this.colsToDeriveFrom = this.function.colsToDeriveFrom.map(o => o.value);
          this.deriveFunctions = [];
          this.params = [[]];
          for (let availableFunction of this.function.functionsToDeriveWith) {
            this.deriveFunctions.push(availableFunction.funct.name);
            this.params.push(availableFunction.functParams);
          }
          this.docstring = this.function.docstring;
        }
      }
    }
  }

  findCustomFunctionByName(transformation, name) {
    for (let f of transformation.customFunctionDeclarations) {
      if (f.name == name)
        return f;
    }
  }

  reduceFunctionParams(idx) {
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
    this.deriveFunctions.splice(idx, 1);
    this.params.splice(idx, 1);
  }

  accept() {
    this.function.newColName = this.newColName;
    this.function.colsToDeriveFrom = [];
    for (let i = 0; i < this.colsToDeriveFrom.length; ++i) {
      this.function.colsToDeriveFrom.push({ id: 0, value: this.colsToDeriveFrom[i] });
    }
    this.function.functionsToDeriveWith = [];
    for (let i = 0; i < this.deriveFunctions.length; ++i) {
      let cf = this.findCustomFunctionByName(this.transformation, this.deriveFunctions[i]);
      this.function.functionsToDeriveWith.push(new transformationDataModel.FunctionWithArgs(cf, this.params[i]));
    }
    this.function.docstring = this.docstring;
    this.emitter.emit(this.function);
    this.initFunction();
    this.modalEnabled = false;
  }

  cancel() { this.modalEnabled = false; }

}
