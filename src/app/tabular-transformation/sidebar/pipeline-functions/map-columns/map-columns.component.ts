import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CompleterService, CompleterData, CompleterItem } from 'ng2-completer';

import * as transformationDataModel from '../../../../../assets/transformationdatamodel.js';
//TODO: remove when passing transformation is implemented
import * as data from '../../../../../assets/data.json';

@Component({
  selector: 'map-columns',
  templateUrl: './map-columns.component.html',
  styleUrls: ['./map-columns.component.css']
})
export class MapColumnsComponent implements OnInit {

  @Input() modalEnabled;
  @Input() private function: any;
  @Output() emitter = new EventEmitter();
  // TODO: Pass column names of the uploaded dataset
  //@Input() columns: String[] = [];
  // Transformation is needed to search for prefixers/functions
  //@Input() transformation: any;
  private transformation: any;
  private columns: String[] = ["ColumnName1", "ColumnName2", "ColumnName3"];

  private keyFunctionPairs: any[] = []; // type keyFunctionPair
  private functionsToMapWith: any[] = []; // type customFunctionDeclaration
  private keys: String[] = [];
  private params: any[] = [];
  private docstring: String;

  private dataService: CompleterData;
  private availableFunctions: any[] = [];

  constructor(private completerService: CompleterService) {
    this.transformation = transformationDataModel.Transformation.revive(data);


    this.dataService = completerService.local(this.transformation.customFunctionDeclarations, 'name', 'name');
    if (!this.function) {
      this.keyFunctionPairs = [new transformationDataModel.KeyFunctionPair(null, null, [])];
      this.functionsToMapWith = [undefined];
      this.keys = [""];
      this.function = new transformationDataModel.MapcFunction(this.keyFunctionPairs, this.docstring);
    }
    else {
      this.keyFunctionPairs = this.function.keyFunctionPairs;

      for (let availableFunction of this.function.keyFunctionPairs) {
        this.functionsToMapWith.push(availableFunction.func);
        this.keys.push(availableFunction.key);
        this.docstring = this.function.docstring;

      }
    }

  }

  ngOnInit() {
  }

  accept() {
    this.function.keyFunctionPairs = this.keyFunctionPairs;
    this.function.docstring = this.docstring;
    this.emitter.emit(this.function);
    this.modalEnabled = false;
  }

  onFunctionSelected(selected: CompleterItem, idx) {
    this.keyFunctionPairs[idx] = new transformationDataModel.KeyFunctionPair(this.keys[idx], selected.originalObject, []);
  }

  addMapping() {
    this.functionsToMapWith.push(undefined);
    this.keys.push("");
    this.keyFunctionPairs.push(new transformationDataModel.KeyFunctionPair("", undefined, []));
  }
  removeMapping(idx) {

    this.functionsToMapWith.splice(idx, 1);
    this.keys.splice(idx, 1);
    this.keyFunctionPairs.splice(idx, 1);

  }
  getparams(idx) {

    var params = [];
    if (this.keyFunctionPairs[idx].func) { params = this.keyFunctionPairs[idx].getParams(); }
    return params;

  }


  cancel() {
    this.modalEnabled = false;
  }

}
