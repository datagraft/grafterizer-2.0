import { Component, OnInit, Input } from '@angular/core';

declare var Plotly;

@Component({
  selector: 'boxplot',
  templateUrl: './boxplot.component.html',
  styleUrls: ['./boxplot.component.css']
})
export class BoxplotComponent implements OnInit {


  private dataInfo = {
  y: [],
  type: 'box',
  name:" ",
  marker: {
    color: 'rgb(0,0,0)',
    outliercolor: 'rgb(255, 0, 0)',
    line: {
      outliercolor: 'rgb(255, 0, 0)',
      outlierwidth: 0
    }
  },
  boxpoints: 'suspectedoutliers'
};

  private layout={
    autosize: true,
     margin: {
        t: 30,
        b: 50
      }
  };
  

  private data = [this.dataInfo];

  constructor() { }

  ngOnInit() {
  }

  @Input()
  set column(values : Array<Number>){
    this.dataInfo.y = values;
    Plotly.newPlot('box-plot', this.data, this.layout, {displayModeBar: false});
  }

}
