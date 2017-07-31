import { Component, OnInit, EventEmitter, Input, Output } from '@angular/core';
import { StatisticService } from '../statistic-service/statistic.service';

@Component({
  selector: 'line-chart',
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.css']
})
export class LineChartComponent implements OnInit {

  @Output()
  done : EventEmitter<any> = new EventEmitter();

  data : any =[];

  view: any[] = undefined;

  // options
  showXAxis = true;
  showYAxis = true;
  gradient = false;
  showLegend = false;
  showXAxisLabel = true;
  showYAxisLabel = true;
  yAxisLabel ;
  showRefLines = true;
  showRefLabels = true;
  referenceLines = undefined;

  colorScheme = {
    domain: ['#5AA454', '#A10A28', '#C7B42C', '#AAAAAA', '#5B5393', '#FFE0AA']
  };

  autoScale = true;

  constructor(private statisticService :  StatisticService) { }

  ngOnInit() {
  }

   @Input()
  set chartData(data: Object){
    if ( data ) { 
      this.data = [];
      let series = [];
      this.referenceLines = [];
      let timePeriod = data['info']['period'];
      timePeriod = timePeriod.map(date => {
                                return  new Date(date);
                              });
      let values = data['info']['values'];
      for(let i in timePeriod){
        series.push({
          "name" : timePeriod[i],
          "value" : values[i]
        });
      }
      this.yAxisLabel = data['name'];
      this.data.push({
        "name": data['name'],
        "series" : series
      })

      this.referenceLines.push({
        "name" : "min",
        "value" : this.statisticService.getMin(values)
      });

      this.referenceLines.push({
        "name" : "max",
        "value" : this.statisticService.getMax(values)
      });

      this.referenceLines.push({
        "name" : "mean",
        "value" : this.statisticService.getMean(values)
      });

      this.done.emit(null);
    }
  }

}
