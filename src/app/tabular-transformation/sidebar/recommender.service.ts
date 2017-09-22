import { Injectable } from '@angular/core';

import * as datalib from 'datalib';

@Injectable()
export class RecommenderService {

  profile = {
    string: 0, //selection contains only strings
    multiple: 0, // 2 or more columns/rows selected
    column: 0,
    row: 0,
    hasLowercase: 0, // string selection contains lowercase characters
    hasDuplicates: 0, // selection of rows contains identical rows
    unsorted: 0, //column is unsorted
    first: 0 // selection is the first row or a subset of cells of the first row
  }

  // 1: compulsory condition, 0 : don't care, -1: forbidden condition
  conditionMatrix = [
    [0, 0, -1, 0, 0, 0, 0, 1],	//Set first row as header
    [1, 0, 1, -1, 1, 0, 0, 0],  //Set to uppercase
    [0, 0, -1, 1, 0, 0, 0, 0],  //Take rows
    [0, 0, -1, 1, 0, 0, 0, 0],	//Shift row
    [0, 0, -1, 1, 0, 0, 0, 0],	//Filter
    [0, 1, -1, 1, 0, 1, 0, 0],	//Deduplicate
    [0, -1, 1, -1, 0, 0, 1, 0],	//Sort
    [0, 1, 1, -1, 0, 0, 0, 0],	//Melt
    [0, -1, 1, -1, 0, 0, 0, 0],	//Cast
    [0, 0, 1, -1, 0, 0, 0, 0],     //Group and Aggregate
    [0, 0, 1, -1, 0, 0, 0, 0],	//Take columns
    [0, 0, 1, -1, 0, 0, 0, 0],  //Derive columns
    [0, 0, 1, -1, 0, 0, 0, 0],  //Shift columns
    [0, 1, 1, -1, 0, 0, 0, 0],  //Merge columns
    [0, -1, 1, -1, 0, 0, 0, 0],	//Split columns
    [0, -1, 1, -1, 0, 0, 0, 0]	//Rename columns
  ];

  functionList = [
    "Set first row as header",
    "Set to uppercase",
    "Take rows",
    "Shift row",
    "Filter",
    "Deduplicate",
    "Sort",
    "Melt",
    "Cast",
    "Group and Aggregate",
    "Take columns",
    "Derive columns",
    "Shift columns",
    "Merge columns",
    "Split columns",
    "Rename columns",
    "Insert column right", //always recommended
    "Insert column left", //always recommended
    "Insert row below", //always recommended
    "Insert row above", //always recommended
    "Delete column", //always recommended
    "Delete row" //always recommended
  ]

  data = [];

  constructor() {
    let csvData = datalib.csv('https://raw.githubusercontent.com/vega/vega-datasets/gh-pages/data/flights-3m.csv');

    for (let o of csvData) {
      let record = [o.date, o.delay, o.distance, o.origin, o.destination];
      this.data.push(record);
    }
  }

  // return the profile of the selection described by : row start, column start, row end, column end indices
  // and total number of rows and cols FROM THE TABLE 
  getDataProfile(rs: number, cs: number, re: number, ce: number, rows: number, columns: number): any {
    //first row selection check
    if (rs == 0 && re == 0) {
      this.profile.first = 1;
    } else {
      this.profile.first = 0;
    }

    //row selection check
    if ((ce - cs) == columns) {
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
    if ((re - rs) == rows) {
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
      this.profile.unsorted = 0;
    } else {
      this.profile.string = 1;
      for (let i = cs; i <= ce; i++) {
        if (!isNaN(Number(this.data[0][i]))) { //+ date checking
          this.profile.string = 0;
          break;
        }
      }
    }

    //sorting check
    if (this.profile.multiple == 0 && this.profile.column == 1) {
      this.profile.unsorted = this.isUnsorted(cs);
    } else {
      this.profile.unsorted = 0;
    }

    //lowercase checking
    if (this.profile.string != 1 || this.profile.multiple == 1 || this.profile.column != 1) {
      this.profile.hasLowercase = 0;
    } else {
      this.profile.hasLowercase = 0;
      for (let value of this.data) {
        if (this.hasLowercase(value[cs])) {
          this.profile.hasLowercase = 1;
          break;
        }
      }
    }

    //duplicate checking
    if (this.profile.multiple == 1 && this.profile.row == 1) {
      let records = [];
      for (let i = rs; i <= re; i++) {
        records.push(this.data[i].join()); //concatenates values of a record to be able to compare them later
      }
      let count = datalib.count(records);
      if (count == count.unique) {
        this.profile.hasDuplicates = 0;
      } else {
        this.profile.hasDuplicates = 1;
      }
    } else {
      this.profile.hasDuplicates = 0;
    }
    return this.profile;
  }

  getRecommendation(profile: any): any {
    console.log(profile);
    let recommendation = ["Insert column right",
      "Insert column left",
      "Insert row below",
      "Insert row above",
      "Delete column",
      "Delete row"];
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

      if ((this.conditionMatrix[i][6] == 1 && profile.unsorted != 1)
        || (this.conditionMatrix[i][6] == -1 && profile.unsorted != 0)) continue;

      if ((this.conditionMatrix[i][7] == 1 && profile.first != 1)
        || (this.conditionMatrix[i][7] == -1 && profile.first != 0)) continue;

      recommendation.push(this.functionList[i]);

    }
    return recommendation;
  }

  isUnsorted(columnIndex: number): number {
    for (let i = 0; i < this.data.length - 1; i++) {
      if (this.data[i][columnIndex] > this.data[i + 1][columnIndex]) return 1;
    }
    return 0;
  }

  hasLowercase(str) {
    return !(str === str.toUpperCase());
  }

}


