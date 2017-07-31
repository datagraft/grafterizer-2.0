import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { StatisticService } from '../statistic-service/statistic.service';


@Component({
  selector: 'histogram',
  templateUrl: './histogram.component.html',
  styleUrls: ['./histogram.component.css']
})
export class HistogramComponent implements OnInit {

  data =[];
  showXAxis = true;
  showYAxis = true;
  showXAxisLabel = true;
  xAxisLabel ;
  showYAxisLabel = true;
  yAxisLabel = 'Number of Values';
  barPadding = 0;
  width : number;
  height : number;
  view : any[] = undefined;

  colorScheme = {
    domain: ['#5AA454', '#A10A28', '#C7B42C', '#AAAAAA', '#5B5393', '#FFE0AA']
  };
  constructor(private statisticService : StatisticService) { }


  @Output() done : EventEmitter<any> = new EventEmitter();

  ngOnInit() {
  }

  @Input()
  set column(values : Array<any>) {
    this.computeHistogram(values);
    this.done.emit(null);
  }

  @Input()
  set header(header : String) {
    this.xAxisLabel = header;
  }

  computeHistogram(values: any) {
    this.data =[];
    let histogram = this.statisticService.getHistogram(values);
    for( let o of histogram){
      this.data.push({"name" : o.value,
                      "value" : o.count});
    }
  }

}
