import { Component, OnInit, Input } from '@angular/core';
import { CompleterService, CompleterData } from 'ng2-completer';

import * as transformationDataModel from '../../../../../assets/transformationdatamodel.js';
//TODO: remove when passing transformation is implemented
import * as data from '../../../../../assets/data.json';

@Component({
  selector: 'filter-rows',
  templateUrl: './filter-rows.component.html',
  styleUrls: ['./filter-rows.component.css']
})

export class FilterRowsComponent implements OnInit {

  @Input() modalEnabled;
  @Input() function: any;
  // Transformation is needed to search for prefixers/functions
  //@Input() transformation: any;
  private transformation: any;
  // TODO: Pass column names of the uploaded dataset
  //@Input() columns: String[] = [];
  private columns: String[] = ["ColumnName1", "ColumnName2", "ColumnName3"];
  private colsToFilter: String[] = [];
  private filterText: String;
  private filterRegex: String;
  private ignoreCase: Boolean;
  private take: Boolean;
  private grepmode: String;
  private functionsToFilterWith: any[] = []; //customFunctionDeclarations
  private filterFunctionsNames: String[] = [];
  //private availableFilter: String[] = ["keyword"];
  private docstring: String;


  protected dataService: CompleterData;


  private renamecolumnsmode: String;

  constructor(private completerService: CompleterService) {
    //TODO: remove when passing transformation is implemented
    this.transformation = transformationDataModel.Transformation.revive(data);
    this.dataService = completerService.local(this.transformation.customFunctionDeclarations, 'name', 'name');
    if (!this.function) {
      this.functionsToFilterWith = [null];
      this.ignoreCase = false;
      this.take = true;
      this.grepmode = "text";
      this.function = new transformationDataModel.GrepFunction(this.take, this.grepmode, this.colsToFilter, this.functionsToFilterWith, this.filterText, this.filterRegex, this.ignoreCase, this.docstring);

      this.filterFunctionsNames = [undefined];
    }
    else {
      this.take = this.function.take;
      this.grepmode = this.function.grepmode;
      this.colsToFilter = this.function.colsToFilter;
      this.functionsToFilterWith = this.function.functionsToFilterWith;
      this.filterText = this.function.filterText;
      this.filterRegex = this.function.filterRegex;
      this.ignoreCase = this.function.ignoreCase;
      for (let functionToFilterWith of this.function.functionsToFilterWith) {
        this.filterFunctionsNames.push(functionToFilterWith.name);

      }

      this.docstring = this.function.docstring;

    }
  }

  ngOnInit() {
    this.modalEnabled = false;

  }

  addFilterFunction() {


    this.functionsToFilterWith.push(null);
    this.filterFunctionsNames.push(undefined);

  }
  removeFilterFunction(idx) {
    this.functionsToFilterWith.splice(idx, 1);
    this.filterFunctionsNames.splice(idx, 1);
  }


  accept() {
    this.function.take = this.take;
    this.function.grepmode = this.grepmode;
    this.function.colsToFilter = this.colsToFilter;

    this.function.filterText = this.filterText;
    this.function.filterRegex = this.filterRegex;
    this.function.ignoreCase = this.ignoreCase;


    this.function.functionsToFilterWith = [];
    for (let filterFunctionsName of this.filterFunctionsNames) {
      this.function.functionsToRenameWith.push(this.transformation.findPrefixerOrCustomFunctionByName(filterFunctionsName));
    }
    this.function.docstring = this.docstring;

    this.modalEnabled = false;
  }


  cancel() {
    this.modalEnabled = false;
  }

}
