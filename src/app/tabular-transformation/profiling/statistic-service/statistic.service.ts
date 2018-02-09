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
  public stdev: number;
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
        // console.log(columndata);
      }
    );

    const profileSummary = (data) => {
      let profile = [];
      let countTotal = datalib.count(data);
      let distinct = datalib.count.distinct(data);
      let valid = datalib.count.valid(data);
      let missing = datalib.count.missing(data);
      let min = datalib.min(data);
      let max = datalib.max(data);
      let mean = datalib.mean(data);
      this.stdev = datalib.stdev(data);
      let quartiles = datalib.quartile(data);

      let histogram_data = [];
      let chartLabels01 = [];

      // outlier detection
      let outliers = 0;
      let first_quartile = quartiles[0];
      let median = quartiles[1];
      let third_quartile = quartiles[2];
      let IQR_below = first_quartile - (1.5 * (third_quartile - first_quartile));
      let IQR_above = third_quartile + (1.5 * (third_quartile - first_quartile));

      for (let i = 0; i < data.length; i++) {
        if (data[i] < IQR_below || data[i] > IQR_above && data[i] != null) {
          this.outlierExample = data[i];
          outliers++;
          valid--;
        }
      }

      // histogram or distinct map
      if (distinct <= 13) {
        let distinctMap = datalib.count.map(data);
        let counter = 0;
        for (let key in distinctMap) {
          let obj = { name: "", value: 0, index: 0 };
          obj.name = key;
          obj.value = distinctMap[key];
          obj.index = counter;
          counter++;
          chartLabels01.push(key);
          histogram_data.push(obj);
        }
      }
      else if (distinct > 13) {
        let histogram = datalib.histogram(data);
        for (let i = 0; i < histogram.length; i++) {
          let obj = { name: "", value: 0, index: 0 };
          for (let key in histogram[i]) {
            if (key == 'count') {
              obj.value = histogram[i][key];
            }
            if (key == 'value') {
              if (i == 0) {
                obj.name = histogram[i][key];
              }
              else {
                let str = histogram[i - 1][key] + ' - ' + histogram[i][key];
                obj.name = str;
              }
              chartLabels01.push(histogram[i][key]);
            }
            obj.index = i;
          }
          histogram_data.push(obj);
        }
      }

      let validity_chartData = [];
      validity_chartData.push(valid);
      validity_chartData.push(missing);
      // validity_chartData.push(outliers);

      let chartLabels02 = ['Valid', 'Missing'];

      let validity_data = [];
      for (let i = 0; i < 2; i++) {
        let obj1 = { name: "", value: 0, index: 0 };
        obj1.name = chartLabels02[i];
        obj1.value = validity_chartData[i];
        obj1.index = i;
        validity_data.push(obj1);
      }

      let tempArray = [];

      tempArray.push(quartiles[0]);
      tempArray.push(quartiles[1]);
      tempArray.push(quartiles[2]);
      tempArray.push(this.stdev);

      let obj2 = { data: [] };
      obj2.data = tempArray;
      let chartData_03 = [];
      chartData_03.push(obj2);

      this.statData[0].value = countTotal;
      this.statData[1].value = distinct;
      this.statData[2].value = Math.round(first_quartile);
      this.statData[3].value = Math.round(mean);
      this.statData[4].value = Math.round(third_quartile);
      this.statData[5].value = Math.round(this.stdev);
      this.statData[6].value = Math.round(min);
      this.statData[7].value = Math.round(max);

      profile.push(countTotal);
      profile.push(distinct);
      profile.push(histogram_data);
      profile.push(validity_data);
      profile.push(chartData_03);
      profile.push(chartLabels01);
      profile.push(chartLabels02);

      // console.log(profile);
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
