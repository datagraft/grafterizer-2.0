import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import {StatisticService} from '../statistic-service/statistic.service';

@Component({
  selector: 'statistic-table',
  templateUrl: './statistic-table.component.html',
  styleUrls: ['./statistic-table.component.css']
})
export class StatisticTableComponent implements OnInit {


  rows = [];
  columns = [
    { name: 'Prop' },
    { name: 'Val' }];

  headerHeight = 0;
  @Output() done: EventEmitter<any> = new EventEmitter();

  constructor(private statisticService: StatisticService) { }

  ngOnInit() {
  }

  @Input()
  set column(values: Array<any>){
    this.rows = [];
    this.fillTable(values);
    this.done.emit(null);
  }

  fillTable(values: Array<any>) {
    this.rows.push({prop : 'Count',
                    val: this.statisticService.getCount(values)});
     this.rows.push({prop : 'Distinct',
                    val: this.statisticService.getDistinctCount(values)});
    const quartiles = this.statisticService.getQuartile(values);
    this.rows.push({prop: 'Quartile 1',
                    val: quartiles[0]});
    this.rows.push({prop: 'Median',
                    val: quartiles[1]});
    this.rows.push({prop: 'Quartile 3',
                    val: quartiles[2]});
    this.rows.push({prop: 'Mean',
                    val:  this.statisticService.getMean(values).toFixed(2)});
    this.rows.push({prop: 'Std. deviation',
                    val:  this.statisticService.getStdev(values).toFixed(2)});
     this.rows.push({prop: 'Min',
                    val:  this.statisticService.getMin(values)});
    this.rows.push({prop: 'Max',
                    val:  this.statisticService.getMax(values)});
 }

}
