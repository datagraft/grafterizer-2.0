import { Injectable } from '@angular/core';
import * as datalib from 'datalib';
import * as transformationDataModel from '../../../assets/transformationdatamodel.js';

@Injectable()
export class RecommenderService {

  private profile = {
    string: 0, //selection contains only strings
    multiple: 0, // 2 or more columns/rows selected
    column: 0,
    row: 0,
    hasLowercase: 0, // string selection contains lowercase characters
    first: 0 // selection is the first row or a subset of cells of the first row
  }

  // 1: compulsory condition, 0 : don't care, -1: forbidden condition
  private conditionMatrix = [
    //[string|multiple|column|row|hasLowercase|hasDuplicates|first]
    [0, 0, 0, 0, 0, 0],	//Make dataset
    [0, 0, 1, -1, 0, 0], //Group and Aggregate
    [0, 0, 0, 0, 0, 0], //Reshape dataset (melt)
    [0, 0, 1, -1, 0, 0],	//Sort dataset
    [0, 0, 1, -1, 0, 0],	//Derive columns
    [0, 0, 1, -1, 0, 0], //Mapc
    [0, -1, 1, -1, 0, 0],	//Add columns
    [0, 0, 1, -1, 0, 0],	//Take columns
    [0, -1, 1, -1, 0, 0],	//Shift column   
    [0, 1, 1, -1, 0, 0],  //Merge columns    
    [0, -1, 1, -1, 0, 0],	//Split columns 
    [0, 0, 1, -1, 0, 0],	//Rename columns
    [0, 0, -1, 1, 0, 0],  //Add rows    
    [0, 0, -1, 1, 0, 0],	//Shift row    
    [0, 0, -1, 1, 0, 0],	//Take rows
    [0, 0, -1, 1, 0, 0], //Filter rows
    [0, 0, 0, 0, 0, 0], //Deduplicate
    [0, 0, 0, 0, 0, 0], //Utility function
  ];

  data = [];

  constructor() { }

  // return the profile of the selection described by : row start, column start, row end, column end indices
  // and total number of rows and cols FROM THE TABLE 
  getDataProfile(rs: number, cs: number, re: number, ce: number, rows: number, columns: number, data: any): any {

    //first row selection check
    if (rs == 0 && re == 0) {
      this.profile.first = 1;
    } else {
      this.profile.first = 0;
    }

    //row selection check
    if ((ce - cs) == (columns - 1)) {
      this.profile.row = 1;
      if (rs == re) {
        this.profile.multiple = 0;
      } else {
        this.profile.multiple = 1;
      }
    } else {
      this.profile.row = 0;
    }

    //column selection check
    if ((re - rs) == (rows - 1)) {
      this.profile.column = 1;
      if (cs == ce) {
        this.profile.multiple = 0;
      } else {
        this.profile.multiple = 1;
      }
    } else {
      this.profile.column = 0;
    }

    //string checking
    if (this.profile.row == 1) {
      this.profile.string = 0;

    } else {
      this.profile.string = 1;
      for (let i = cs; i <= ce; i++) {
        if (!isNaN(Number(data[0][i]))) { //+ date checking

          this.profile.string = 0;
          break;
        }
      }
    }
    //lowercase checking
    if (this.profile.string != 1 || this.profile.multiple == 1 || this.profile.column != 1) {
      this.profile.hasLowercase = 0;
    } else {
      this.profile.hasLowercase = 0;
      for (let value of data) {

        if (this.hasLowercase(value[0])) {
          this.profile.hasLowercase = 1;
          break;
        }
      }
    }
    //duplicate checking
    /*  if (this.profile.multiple == 1 && this.profile.row == 1) {
        let records = [];
        for (let i = rs; i <= re; i++) {
          records.push(data[i].join()); //concatenates values of a record to be able to compare them later
        }
        let count = datalib.count(records);
        if (count == count.unique) {
          this.profile.hasDuplicates = 0;
        } else {
          this.profile.hasDuplicates = 1;
        }
      } else {
        this.profile.hasDuplicates = 0;
      }*/
    return this.profile;
  }

  getRecommendationWithParams(rs: number, cs: number, re: number, ce: number, rows: number, columns: number, data: any, headers: any): any {
    var profile = this.getDataProfile(rs, cs, re, ce, rows, columns, data);
    var recommendation = [];
    var functionList = [
      { label: 'Make dataset', value: { id: 'MakeDatasetFunction', defaultParams: null } },
      { label: 'Group and aggregate', value: { id: 'GroupRowsFunction', defaultParams: null } },
      { label: 'Reshape dataset', value: { id: 'MeltFunction', defaultParams: null } },
      { label: 'Sort dataset', value: { id: 'SortDatasetFunction', defaultParams: null } },
      { label: 'Derive column', value: { id: 'DeriveColumnFunction', defaultParams: null } },
      { label: 'Map columns', value: { id: 'MapcFunction', defaultParams: null } },
      { label: 'Add columns', value: { id: 'AddColumnsFunction', defaultParams: null } },
      { label: 'Take columns', value: { id: 'ColumnsFunction', defaultParams: null } },
      { label: 'Shift column', value: { id: 'ShiftColumnFunction', defaultParams: null } },
      { label: 'Merge columns', value: { id: 'MergeColumnsFunction', defaultParams: null } },
      { label: 'Split columns', value: { id: 'SplitFunction', defaultParams: null } },
      { label: 'Rename columns', value: { id: 'RenameColumnsFunction', defaultParams: null } },
      { label: 'Add row', value: { id: 'AddRowFunction', defaultParams: null } },
      { label: 'Shift row', value: { id: 'ShiftRowFunction', defaultParams: null } },
      { label: 'Take rows', value: { id: 'DropRowsFunction', defaultParams: null } },
      { label: 'Filter rows', value: { id: 'GrepFunction', defaultParams: null } },
      { label: 'Deduplicate', value: { id: 'RemoveDuplicatesFunction', defaultParams: null } },
      { label: 'Utility function', value: { id: 'UtilityFunction', defaultParams: null } }
    ];

    for (let i = 0; i < this.conditionMatrix.length; i++) {
      if ((this.conditionMatrix[i][0] == 1 && profile.string != 1)
        || (this.conditionMatrix[i][0] == -1 && profile.string != 0)) continue;

      if ((this.conditionMatrix[i][1] == 1 && profile.multiple != 1)
        || (this.conditionMatrix[i][1] == -1 && profile.multiple != 0)) continue;

      if ((this.conditionMatrix[i][2] == 1 && profile.column != 1)
        || (this.conditionMatrix[i][2] == -1 && profile.column != 0)) continue;

      if ((this.conditionMatrix[i][3] == 1 && profile.row != 1)
        || (this.conditionMatrix[i][3] == -1 && profile.row != 0)) continue;

      if ((this.conditionMatrix[i][4] == 1 && profile.hasLowercase != 1)
        || (this.conditionMatrix[i][4] == -1 && profile.hasLowercase != 0)) continue;

      if ((this.conditionMatrix[i][5] == 1 && profile.hasDuplicates != 1)
        || (this.conditionMatrix[i][5] == -1 && profile.hasDuplicates != 0)) continue;

      if ((this.conditionMatrix[i][7] == 1 && profile.first != 1)
        || (this.conditionMatrix[i][7] == -1 && profile.first != 0)) continue;

      recommendation.push(functionList[i]);

    }
    // Push always recommended functions
    for (let i = this.conditionMatrix.length; i < functionList.length; ++i) {
      recommendation.push(functionList[i]);
    }
    return recommendation;

  }

  keyFunctionPairs(keys: String[], f: any) {
    var pairs = [];
    for (let key of keys) {

      pairs.push(new transformationDataModel.KeyFunctionPair(key, f, []));
    }
    return pairs;
  }

  hasLowercase(str) {
    return false;
    // return !(str === str.toUpperCase());
  }

}


