import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CompleterService, CompleterData } from 'ng2-completer';

import * as transformationDataModel from '../../../../../assets/transformationdatamodel.js';
//TODO: remove when passing transformation is implemented
import * as data from '../../../../../assets/data.json';

@Component({
  selector: 'rename-columns',
  templateUrl: './rename-columns.component.html',
  styleUrls: ['./rename-columns.component.css']
})

export class RenameColumnsComponent implements OnInit {

  @Input() modalEnabled;
  @Input() private function: any;
  @Output() emitter = new EventEmitter();
  // Transformation is needed to search for prefixers/functions
  //@Input() transformation: any;
  private transformation: any;
  // TODO: Pass column names of the uploaded dataset
  //@Input() columns: String[] = [];
  private columns: String[] = ["ColumnName1", "ColumnName2", "ColumnName3"];
  private mappings: any = [null, null];
  private functionsToRenameWith: String[] = [];
  private test: String[] = ["keyword"];
  private docstring: String;
  private smth: String;

  //private dataService: CompleterData;

  protected dataService: CompleterData;


  private renamecolumnsmode: String;

  constructor(private completerService: CompleterService) {
    //TODO: remove when passing transformation is implemented
    this.transformation = transformationDataModel.Transformation.revive(data);
    this.dataService = completerService.local(this.transformation.customFunctionDeclarations, 'name', 'name');
    if (!this.function) {
      this.functionsToRenameWith = ["keyword"];
      this.function = new transformationDataModel.RenameColumnsFunction(this.transformation.findPrefixerOrCustomFunctionByName("keyword"), this.mappings, this.docstring);
    }
    else {
      this.mappings = this.function.mappings;
      for (let functionToRenameWith of this.function.functionsToRenameWith) {
        this.functionsToRenameWith.push(functionToRenameWith);
      }
      this.docstring = this.function.docstring;

    }
  }

  ngOnInit() {
    this.modalEnabled = false;

  }

  addRenameFunction() {


    this.functionsToRenameWith.push(undefined);
    this.test.push(undefined);

  }
  removeFunction(idx) {
    this.functionsToRenameWith.splice(idx, 1);
    this.test.splice(idx, 1);
  }

  addMapping() {
    this.mappings.push(null, null);
  }
  removeMapping(idx) {
    this.mappings.splice(idx, 2);
  }
  accept() {
    this.function.mappings = this.mappings;
    this.function.functionsToRenameWith = [];
    for (let functionToRenameWith of this.test) {
      this.function.functionsToRenameWith.push(this.transformation.findPrefixerOrCustomFunctionByName(functionToRenameWith));
    }
    this.function.docstring = this.docstring;
    this.emitter.emit(this.function);
    this.modalEnabled = false;
  }

  getmaplength() {
    var b = [];
    for (var i = 0; i < this.mappings.length; i += 2) b.push(i);
    return b;
  }
  cancel() {
    this.modalEnabled = false;
  }

}
