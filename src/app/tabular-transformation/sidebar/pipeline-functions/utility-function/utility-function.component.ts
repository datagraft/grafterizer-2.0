import { Component, OnInit, Input } from '@angular/core';
import { CompleterService, CompleterData, CompleterItem } from 'ng2-completer';

import * as transformationDataModel from '../../../../../assets/transformationdatamodel.js';
//TODO: remove when passing transformation is implemented
import * as data from '../../../../../assets/data.json';
@Component({
  selector: 'utility-function',
  templateUrl: './utility-function.component.html',
  styleUrls: ['./utility-function.component.css']
})
export class UtilityFunctionComponent implements OnInit {

  @Input() modalEnabled;
  @Input() function: any;
  // TODO: Pass column names of the uploaded dataset
  //@Input() columns: String[] = [];
  // Transformation is needed to search for prefixers/functions
  //@Input() transformation: any;
  private transformation: any;

  private functionName: any; //FunctionWithArgs
  private fn: any; //CustomFunctionDeclaration
  private docstring: String;

  private dataService: CompleterData;

  constructor(private completerService: CompleterService) {
    this.transformation = transformationDataModel.Transformation.revive(data);

    /*for (let availableFunction of this.transformation.customFunctionDeclarations) {
      this.availableFunctions.push(new transformationDataModel.FunctionWithArgs(availableFunction, []))
    }*/
    this.dataService = completerService.local(this.transformation.customFunctionDeclarations, 'name', 'name');
    if (!this.function) {
      this.functionName = new transformationDataModel.FunctionWithArgs(null, []);
      this.function = new transformationDataModel.UtilityFunction(this.functionName, this.docstring);
    }
    else {
      this.functionName = this.function.functionName;

      this.docstring = this.function.docstring;

    }
  }



  ngOnInit() {
  }
  onFunctionSelected(selected: CompleterItem) {

    // this.availableDeriveFunctions[idx] = selected.originalObject;
    this.functionName = new transformationDataModel.FunctionWithArgs(selected.originalObject, []);
    // console.log(this.functionName);
    // console.log(this.functionName.getParams());
  }

  accept() {
    this.function.functionName = new transformationDataModel.FunctionWithArgs(this.fn, this.functionName.functParams);

    this.function.docstring = this.docstring;
    this.modalEnabled = false;
  }

  reduceFunctionParams() {

    var params = this.functionName.getParams();
    return params;
  }

  cancel() {
    this.modalEnabled = false;
  }

}
