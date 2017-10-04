import { Component, OnInit, Input } from '@angular/core';
import { CompleterService, CompleterData, CompleterItem } from 'ng2-completer';

import * as transformationDataModel from '../../../../../assets/transformationdatamodel.js';
//TODO: remove when passing transformation is implemented
import * as data from '../../../../../assets/data.json';
@Component({
  selector: 'derive-column',
  templateUrl: './derive-column.component.html',
  styleUrls: ['./derive-column.component.css']
})
export class DeriveColumnComponent implements OnInit {

  @Input() modalEnabled;
  @Input() function: any;
  // TODO: Pass column names of the uploaded dataset
  //@Input() columns: String[] = [];
  // Transformation is needed to search for prefixers/functions
  //@Input() transformation: any;
  private transformation: any;
  private columns: String[] = ["ColumnName1", "ColumnName2", "ColumnName3"];

  private newColName: String;
  private colsToDeriveFrom: any = [];

  private availableDeriveFunctions: any[] = []; // type customFunctionDeclaration
  private functionsToDeriveWith: any[] = []; // type functionWithArgs
  private params: any[] = [];
  private docstring: String;

  private dataService: CompleterData;
  private availableFunctions: any[] = [];

  constructor(private completerService: CompleterService) {
    this.transformation = transformationDataModel.Transformation.revive(data);

    /*for (let availableFunction of this.transformation.customFunctionDeclarations) {
      this.availableFunctions.push(new transformationDataModel.FunctionWithArgs(availableFunction, []))
    }*/
    this.dataService = completerService.local(this.transformation.customFunctionDeclarations, 'name', 'name');
    if (!this.function) {
      this.functionsToDeriveWith = [new transformationDataModel.FunctionWithArgs(null, [])];
      this.availableDeriveFunctions = [undefined]
      this.function = new transformationDataModel.DeriveColumnFunction(this.newColName, this.colsToDeriveFrom, this.functionsToDeriveWith, this.docstring);
    }
    else {
      this.newColName = this.function.newColName;
      this.colsToDeriveFrom = this.function.colsToDeriveFrom;
      this.functionsToDeriveWith = this.function.functionsToDeriveWith;
      for (let availableFunction of this.function.functionsToDeriveWith) {
        this.availableDeriveFunctions.push(availableFunction.funct);
        this.docstring = this.function.docstring;

      }
    }
    // this.availableDeriveFunctions = [new transformationDataModel.FunctionWithArgs(null, [])];//this.functionsToDeriveWith;
  }

  ngOnInit() {
  }

  accept() {
    this.function.newColName = this.newColName;
    this.function.colsToDeriveFrom = this.colsToDeriveFrom;
    this.function.functionsToDeriveWith = this.functionsToDeriveWith;
    this.function.docstring = this.docstring;
    this.modalEnabled = false;
  }
  reduceFunctionParams(idx) {
    var params = this.functionsToDeriveWith[idx].getParams();

    for (let i of this.colsToDeriveFrom.length) {
      params.splice(0, 1);
    }
    return params;
  }
  onFunctionSelected(selected: CompleterItem, idx) {
    console.log(selected);
    // this.availableDeriveFunctions[idx] = selected.originalObject;
    this.functionsToDeriveWith[idx] = new transformationDataModel.FunctionWithArgs(selected.originalObject, []);
  }

  addDeriveFunction() {
    //  this.functionsToDeriveWith.push(new transformationDataModel.FunctionWithArgs(null, []));
    //  this.availableDeriveFunctions = this.functionsToDeriveWith.slice();
    this.availableDeriveFunctions.push(undefined);
    this.functionsToDeriveWith.push(new transformationDataModel.FunctionWithArgs(undefined, []));
  }
  removeFunction(idx) {
    console.log(this.functionsToDeriveWith[idx]);
    console.log(this.availableDeriveFunctions[idx]);
    this.availableDeriveFunctions.splice(idx, 1);
    this.functionsToDeriveWith.splice(idx, 1);
    //this.availableDeriveFunctions = this.functionsToDeriveWith.slice();
  }


  cancel() {
    this.modalEnabled = false;
  }

}
