import { Component, OnInit, Input, Output, SimpleChanges, EventEmitter, OnChanges } from '@angular/core';
import { CompleterService, CompleterData, CompleterItem } from 'ng2-completer';
import * as transformationDataModel from '../../../../../assets/transformationdatamodel.js';

@Component({
  selector: 'map-columns',
  templateUrl: './map-columns.component.html',
  styleUrls: ['./map-columns.component.css']
})

export class MapColumnsComponent implements OnInit, OnChanges {

  @Input() modalEnabled;
  @Input() function: any;
  @Input() defaultParams;
  @Input() columns: String[] = [];
  @Input() transformation: any;
  @Output() emitter = new EventEmitter();
  private keyFunctionPairs: any[] = []; // type keyFunctionPair
  private functionsToMapWith: any[] = []; // type customFunctionDeclaration
  private keys: String[] = [];
  private params: any[] = [];
  private docstring: String;

  private dataService: CompleterData;
  private availableFunctions: any[] = [];

  constructor(private completerService: CompleterService) {
    // this.transformation = transformationDataModel.Transformation.revive(data);
    // this.dataService = completerService.local(this.transformation.customFunctionDeclarations, 'name', 'name');
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
  ngOnChanges(changes: SimpleChanges) {

    if (changes.defaultParams && this.defaultParams) {
      if (this.defaultParams.keyFunctionPairs) {

        this.keyFunctionPairs[0] = new transformationDataModel.KeyFunctionPair(this.defaultParams.keyFunctionPairs[0].key, this.defaultParams.keyFunctionPairs[0].func, []);
        this.functionsToMapWith[0] = this.defaultParams.keyFunctionPairs[0].func;
        this.keys[0] = this.defaultParams.keyFunctionPairs[0].key;
        for (let i = 1; i < this.defaultParams.keyFunctionPairs.length; ++i) {
          this.keyFunctionPairs.push(new transformationDataModel.KeyFunctionPair(this.defaultParams.keyFunctionPairs[i].key, this.defaultParams.keyFunctionPairs[i].func, []));
          this.functionsToMapWith.push(this.defaultParams.keyFunctionPairs[i].func);
          this.keys.push(this.defaultParams.keyFunctionPairs[i].key);

        }
      }

    }
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
