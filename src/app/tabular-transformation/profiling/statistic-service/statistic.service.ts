import { Injectable } from '@angular/core';

import * as datalib from 'datalib';

@Injectable()
export class StatisticService {

  constructor() { }

  public getCount(values : Array<any>) : Number {
    return datalib.count(values);
  }

  public getValidCount(values : Array<any>) : Number {
    return datalib.count.valid(values);
  }

  public getMissingCount(values : Array<any>) : Number {
    return datalib.count.missing(values);
  }

  public getDistinctCount(values : Array<any>) : Number {
    return datalib.count.distinct(values);
  }

  public getMedian(values : Array<Number>) : Number {
    return datalib.median(values);
  }

  public getQuartile(values : Array<Number>) : Array<Number> {
    return datalib.quartile(values);
  }
  
  public getSum(values : Array<Number>) : Number {
      return datalib.sum(values);
  }

  public getMean(values : Array<Number>) : Number {
    return datalib.mean(values);
  }

  public getVariance(values : Array<Number>) : Number {
    return datalib.variance(values);
  }

  public getStdev(values : Array<Number>) : Number {
    return datalib.stdev(values);
  }

  public getMin(values : Array<any>) : any {
    return datalib.min(values);
  }

  public getMax(values : Array<any>) : any {
    return datalib.max(values);
  }

  public getHistogram(values : Array<Number>) : Array<any> {
     return datalib.histogram(values);
  }

  public getProfile(values : Array<Number>) : Object {
    return datalib.profile();
  }

  public getCountMap(values : Array<any>) : Object {
    return datalib.count.map(values);
  } 

}
