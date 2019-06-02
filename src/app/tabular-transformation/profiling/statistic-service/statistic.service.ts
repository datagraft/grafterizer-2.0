import { Injectable } from '@angular/core';
import * as datalib from 'datalib';

@Injectable()
export class StatisticService {

  public data: any;
  public statData: any;
  public columnData = [];
  public profile: any;
  public columnSelected: any;
  public typesInferred: any;
  public typeInferred: any;
  public stdev: any;
  public outlierExample: any;

  constructor() {
    this.statData = [
      { stat: 'Count', value: 0 },
      { stat: 'Distinct', value: 0 },
      { stat: 'Quartile 1', value: 0 },
      { stat: 'Mean', value: 0 },
      { stat: 'Quartile 3', value: 0 },
      { stat: 'Std. deviation', value: 0 },
      { stat: 'Min', value: 0 },
      { stat: 'Max', value: 0 },
    ];
  }

  public loadJSON(data: any) {
    return datalib.read(data, { type: 'json', parse: 'auto' });
  }

  public buildProfile(data: any, header: any, handsontableSelection) {
    let columnIndex = handsontableSelection.col;
    let columnHeader = header[columnIndex];
    const promise = new Promise(
      (resolve, reject) => {
        const columndata = [];
        for (let i = 0; i < data.length; i++) {
          let obj = data[i];
          for (let o in obj) {
            if (columnHeader == o) {
              columndata.push(obj[o]);
            }
          }
        }
        resolve(columndata);
      }
    );

    const profileSummary = (columnData) => {
      let data;
      let dataType = datalib.type.infer(columnData);
      // if single cell is selected in handsontable --> data eaquals that cell only
      if (handsontableSelection.row == handsontableSelection.row2) {
        data = [columnData[handsontableSelection.row]];
      } else {
        data = columnData;
      }
      let min;
      let max;
      let mean;
      let quartiles;
      let valid = datalib.count.valid(data);
      let missing = datalib.count.missing(data);
      let profile = [];
      let histogramData = [];
      let boxPlotLabels = [];
      let chartQuartiles = [];
      if (dataType === 'integer' || dataType === 'number') {
        min = datalib.min(data);
        max = datalib.max(data);
        mean = datalib.mean(data);
        this.stdev = datalib.stdev(data);
        // if column is selected in handsontable --> compute data distribution and quartiles      
        if (handsontableSelection.row !== handsontableSelection.row2) {
          // outlier detection
          quartiles = datalib.quartile(data);
          chartQuartiles.push({ data: [quartiles.slice(0, 3), this.stdev] });
        }
      } else if (dataType === 'string' || dataType === 'boolean' || dataType === 'date') {
        quartiles = ['NaN', 'NaN', 'NaN'];
        this.stdev = 'NaN';
      }

      // histogram or distinct map
      let distinct = datalib.count.distinct(data);
      if (distinct <= 13) {
        let distinctMap = datalib.count.map(data);
        var autoFormat = datalib.format.auto.number('s');
        let counter = 0;
        for (let key in distinctMap) {
          let obj = { name: "", value: 0, index: 0 };
          obj.name = key;
          obj.value = autoFormat(distinctMap[key]);
          obj.index = counter;
          counter++;
          if (dataType === 'number' || dataType === 'integer') {
            boxPlotLabels.push(key);
          }
          histogramData.push(obj);
        }
      }
      else if (distinct > 13 && dataType === 'number' || dataType === 'integer') {
        let histogram = datalib.histogram(data, { min: min, max: max, maxbins: 14 });
        var autoFormat = datalib.format.auto.number('s');
        let counter = 0;
        for (let key in histogram) {
          if (key !== 'bins') {
            let obj = { name: "", value: 0, index: 0 };
            obj.name = autoFormat(histogram[key].value);
            obj.value = histogram[key].count;
            obj.index = counter;
            if (obj.index < histogram.length - 1) {
              let increment = counter + 1;
              obj.name = obj.name.toString().concat('-', autoFormat(histogram[increment.toString()].value).toString());
              boxPlotLabels.push(obj.name);
            }
            counter++;
            if (obj.value > 0) {
              histogramData.push(obj);
            }
          }
        }
      }

      let validity_chartData = [];
      validity_chartData.push(valid);
      validity_chartData.push(missing);
      let validityLabels = ['Valid', 'Missing'];
      let validityData = [];
      for (let i = 0; i < 2; i++) {
        let obj1 = { name: "", value: 0, index: 0 };
        obj1.name = validityLabels[i];
        obj1.value = validity_chartData[i];
        obj1.index = i;
        validityData.push(obj1);
      }

      // if single cell is selected in handsontable --> information about data distribution is not available, i.e., 'NaN'      
      let countTotal = datalib.count(data);
      if (handsontableSelection.row == handsontableSelection.row2) {
        this.statData[0].value = countTotal;
        this.statData[1].value = distinct;
        this.statData[2].value = 'NA';
        this.statData[3].value = 'NA';
        this.statData[4].value = 'NA';
        this.statData[5].value = 'NA';
        this.statData[6].value = 'NA';
        this.statData[7].value = 'NA';
        boxPlotLabels = [];
      } else {
        // if column is selected in handsontable --> information about data distribution is available              
        this.statData[0].value = countTotal;
        this.statData[1].value = distinct;
        this.statData[2].value = Math.round(quartiles[0]);
        this.statData[3].value = Math.round(mean);
        this.statData[4].value = Math.round(quartiles[2]);
        this.statData[5].value = Math.round(this.stdev);
        this.statData[6].value = Math.round(min);
        this.statData[7].value = Math.round(max);
      }

      profile.push(countTotal);
      profile.push(distinct);
      profile.push(histogramData);
      profile.push(validityData);
      profile.push(chartQuartiles);
      profile.push(boxPlotLabels);
      profile.push(validityLabels);

      return Promise.resolve(profile);
    }
    promise
      .then(profileSummary)
      .then(fulfilled => {
        this.profile = fulfilled;
      });
  }

  public getCount(values: Array<any>): Number {
    return datalib.count(values);
  }

  public getValidCount(values: Array<any>): Number {
    return datalib.count.valid(values);
  }

  public getMissingCount(values: Array<any>): Number {
    return datalib.count.missing(values);
  }

  public getDistinctCount(values: Array<any>): Number {
    return datalib.count.distinct(values);
  }

  public getMedian(values: Array<Number>): Number {
    return datalib.median(values);
  }

  public getQuartile(values: Array<Number>): Array<Number> {
    return datalib.quartile(values);
  }

  public getSum(values: Array<Number>): Number {
    return datalib.sum(values);
  }

  public getMean(values: Array<Number>): Number {
    return datalib.mean(values);
  }

  public getVariance(values: Array<Number>): Number {
    return datalib.variance(values);
  }

  public getStdev(values: Array<Number>): Number {
    return datalib.stdev(values);
  }

  public getMin(values: Array<any>): any {
    return datalib.min(values);
  }

  public getMax(values: Array<any>): any {
    return datalib.max(values);
  }

  public getHistogram(values: Array<Number>): Array<any> {
    return datalib.histogram(values);
  }

  public getProfile(values: Array<Number>): Object {
    return datalib.profile();
  }

  public getCountMap(values: Array<any>): Object {
    return datalib.count.map(values);
  }
}
