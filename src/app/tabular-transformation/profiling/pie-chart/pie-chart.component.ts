import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { StatisticService } from '../statistic-service/statistic.service';

@Component({
  selector: 'filled-piechart',
  templateUrl: './pie-chart.component.html',
  styleUrls: ['./pie-chart.component.css']
})
export class PieChartComponent implements OnInit {

  view: any[] = undefined;
  colorScheme = {
    domain: ['#5AA454', '#A10A28', '#C7B42C', '#AAAAAA', '#5B5393', '#FFE0AA']
  };

  data: any[];

  @Output()
  done: EventEmitter<any> = new EventEmitter();


  // options
  showLegend = false;

  // pie
  showLabels = true;
  explodeSlices = false;
  doughnut = false;

  constructor(private statisticService: StatisticService) { }

  ngOnInit() {
  }

  @Input()
  set chartData(data: any) {

    let chartData = this.statisticService.getCountMap(data);
    this.data = [];
    for (let key in chartData) {
      this.data.push(
        {
          "name": key,
          "value": chartData[key]
        });
    }

    this.done.emit(null);
  }



}
