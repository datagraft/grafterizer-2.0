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

  private d3;
  private gd3;
  private gd;
  private data = [this.dataInfo];
  private created: boolean = false;

  constructor() { 
    
    window.onresize = () => {
          Plotly.Plots.resize(this.gd);
      };
  }

  ngOnInit() {
  }

  @Input() set column(values : Array<Number>){

    if( values ) {

      if(this.created)
        Plotly.deleteTraces('box-plot', 0); 
      else {
          this.d3 = Plotly.d3;
          this.gd3 = this.d3.select('#box-plot')
            .style({
                width: 100 + '%',
                'margin-left': 0 + '%',

                height: 100 + '%',
                'margin-top': 0 + '%'
            });
          this.gd = this.gd3.node();
        }
    
      Plotly.plot(this.gd, [{
          type: 'box',
          y: values,
          marker: {
            color: 'rgb(0,0,0)',
            outliercolor: 'rgb(255, 0, 0)',
            line: {
              outliercolor: 'rgb(255, 0, 0)',
              outlierwidth: 0
            },
          },
          boxpoints: 'suspectedoutliers'
      }], this.layout, {displayModeBar: false});
        this.created= true;

    }
  }

}
