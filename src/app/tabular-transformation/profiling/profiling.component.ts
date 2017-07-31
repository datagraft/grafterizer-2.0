import { Component, OnInit } from '@angular/core';

import * as datalib from 'datalib';
import { StatisticService } from './statistic-service/statistic.service';

@Component({
  selector: 'profiling',
  templateUrl: './profiling.component.html',
  styleUrls: ['./profiling.component.css'],
  providers: [StatisticService]
})
export class ProfilingComponent implements OnInit {

  private chartData: any = null;
  private csvData: any;
  private header : String = null;
  private column =[];
  private pieChartDone : boolean = false;
  private statisticsDone : boolean = false;
  private histogramDone : boolean = false;
  private lineChartData : Object = null;
  private timePeriod = [];

  constructor(private statisticService : StatisticService ) {}

  ngOnInit(): void {
    
  }

  getHeader(header : string) {
    this.csvData = datalib.csv('https://raw.githubusercontent.com/vega/vega-datasets/gh-pages/data/seattle-weather.csv');
    this.column=[];
    this.timePeriod = [];
    for (let o of this.csvData){
      this.column.push(o[header]);
      this.timePeriod.push(o['date']);
    }
    this.validateLineChartData(header);
    this.header = header;
  }

  validateChartData(){
     this.chartData = {valid : this.statisticService.getValidCount(this.column),
                      missing : this.statisticService.getMissingCount(this.column)};
  }

  validateLineChartData(header: string){
    this.lineChartData = {
      "name" : header,
      "info" : {
        "period" : this.timePeriod ,
        "values" : this.column
      }
    }
  }

  onPiechartDone(){
    setTimeout(() =>{ this.pieChartDone = true;},0);
  }

  onStatisticsDone(){
    setTimeout(() =>{this.statisticsDone =true;},0);
  }

  onHistogramDone(){

    setTimeout(() =>{this.histogramDone = true;},0);
  }

}
