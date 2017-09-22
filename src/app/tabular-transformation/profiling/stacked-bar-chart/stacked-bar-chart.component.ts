import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

import * as datalib from 'datalib';

@Component({
  selector: 'stacked-bar-chart',
  templateUrl: './stacked-bar-chart.component.html',
  styleUrls: ['./stacked-bar-chart.component.css']
})
export class StackedBarChartComponent implements OnInit {

  @Output()
  done: EventEmitter<any> = new EventEmitter();

  view: any[] = undefined;
  data = [];
  showXAxis = true;
  showYAxis = true;
  gradient = false;
  showLegend = false;
  showXAxisLabel = true;
  xAxisLabel;
  showYAxisLabel = true;
  yAxisLabel;
  colorScheme = {
    domain: ['#5AA454', '#A10A28', '#C7B42C', '#AAAAAA', '#5B5393', '#FFE0AA']
  };

  constructor() { }

  ngOnInit() {
  }

  @Input()
  set chartData(data: Object) {

    if (data) {
      this.data = [];
      let series = [];
      let timePeriod = data['info']['period'];
      let values = data['info']['values'];
      this.yAxisLabel = data['name'];
      //get year-value  records
      for (var i = 0; i < timePeriod.length; i++) {
        timePeriod[i] = {
          "year": new Date(timePeriod[i]).getFullYear(),
          "value": values[i]
        }
      }

      //grouping by year
      let grouped = datalib.groupby('year').execute(timePeriod);
      for (let group of grouped) {
        //grouping by value e.g. rain/snow/sun and counting the values for the group
        group.values = datalib.groupby('value').count().execute(group.values);
        let series = [];
        for (let value of group.values) {
          series.push({
            "name": value.value,
            "value": value.count
          });
        }
        //sorting to get the same order, colors of the values
        series.sort((a, b) => {
          if (a.name > b.name) return -1;
          if (a.name < b.name) return 1;
          return 0;
        });
        this.data.push({
          "name": String(group.year),
          "series": series
        });

      }
      this.done.emit(null);

    }

  }

}
