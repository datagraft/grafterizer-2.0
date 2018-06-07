import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { barChart_init, advancedPieChart_init } from './data';

import { StatisticService } from './statistic-service/statistic.service';

declare var Plotly;

@Component({
  selector: 'profiling',
  templateUrl: './profiling.component.html',
  styleUrls: ['./profiling.component.css'],
  providers: [StatisticService]
})
export class ProfilingComponent implements OnInit {

  @Input() profileSubset: any;
  @Output() profileSubsetEmitter: EventEmitter<number>;

  @Input() dataStatisticsTable = [];
  @Input() dataBarChart: number[];
  @Input() dataAdvancedPieChart: number[];
  @Input() dataBoxplot: any;
  @Input() inferredType: boolean = false;

  // complete dataset from graftwerk
  private data: any;
  private header: any;

  public progressbar: boolean;

  private barChart_init: any[];
  private advancedPieChart_init: any[];

  // barChart and advancedPieChart  
  private dimensionsAdvancedPieChart: any[] = [700, 400];
  private dimensionsBarChart: any[] = [400, 300];

  private tileSpanMissingValues = 1;
  private tileSpanDataDistribution = 3;

  private tileColorMissingValues = 'dimgray';
  private tileColorDataDistribution = 'darkgray';

  //chart 03
  showXAxis = true;
  showYAxis = true;
  showXAxisLabel = true;
  showYAxisLabel = true;
  xAxisLabel = 'Values (displaying at most 14 bins)';
  yAxisLabel = 'Number of values';

  // advanced pie advancedPieChart
  private showLabels = true;
  private explodeSlices = false;
  private doughnut = true;

  private outliersTrace: any;
  private outliersData: any;
  private outliersLayout: any;

  // chart 04
  private datatableBordered = false;
  private datatableStriped = false;

  private colorSchemeAdvancedPieChart = {
    domain: ['#00A896', '#FF1654', '#F9BE02']
  };

  private colorSchemeBarChart = {
    domain: [
      '#003459',
      '#00171F',
      '#007EA7',
      '#F4A261',
      '#9BC1BC',
      '#00A8E8',
      '#F4F1BB',
      '#003459',
      '#00171F',
      '#007EA7',
      '#F4A261',
      '#9BC1BC',
      '#00A8E8',
      '#F4F1BB',
      '#003459',
      '#00171F',
      '#007EA7',
      '#F4A261',
      '#9BC1BC',
      '#00A8E8',
      '#F4F1BB',
      '#003459',
      '#00171F',
      '#007EA7',
      '#F4A261',
      '#9BC1BC',
      '#00A8E8',
      '#F4F1BB'
    ]
  };

  constructor(private statisticService: StatisticService) {
    this.progressbar = false;
    this.profileSubset = new Object();
    this.profileSubset.selection = 0;
    this.profileSubset.chart = 0;
    this.profileSubsetEmitter = new EventEmitter<number>();
    Object.assign(this, { barChart_init, advancedPieChart_init })
  }

  ngOnInit() {
    this.dataBarChart = this.barChart_init;
    this.dataAdvancedPieChart = this.advancedPieChart_init;
    this.dataBoxplot = [0.75, 5.25, 5.5, 6, 6.2, 6.6, 6.80, 7.0, 7.2, 7.5, 7.5, 7.75, 8.15, 8.15, 8.65, 8.93, 9.2, 9.5, 10, 10.25, 11.5, 12, 16, 20.90, 22.3, 23.25];
    this.getOptionsBoxplot();
    Plotly.newPlot('boxplot', this.outliersData, this.outliersLayout, { displayModeBar: false });
    Plotly.redraw('boxplot');
    this.dataStatisticsTable = [
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

  onSelect(event) {
    console.log(event);
    console.log(event.index);
  }

  loadJSON(data: any) {
    this.data = this.statisticService.loadJSON(data[':rows']);
    this.header = data[':column-names'];
  }

  refresh(handsontableSelection) {
    if (handsontableSelection) {
      this.statisticService.buildProfile(this.data, this.header, handsontableSelection);
      setTimeout(() => {
        this.dataBarChart = this.statisticService.profile[2];
        this.dataAdvancedPieChart = this.statisticService.profile[3];
        this.dataBoxplot = this.statisticService.profile[5];
        this.dataStatisticsTable = this.statisticService.statData;
        this.refreshPlotly();
      },
        300);
    }
  };

  refreshPlotly() {
    this.getOptionsBoxplot();
    Plotly.newPlot('boxplot', this.outliersData, this.outliersLayout, { displayModeBar: false });
    Plotly.redraw('boxplot');
  }

  getOptionsBoxplot() {
    this.outliersTrace = {
      y: this.dataBoxplot,
      type: 'box',
      showLegend: false,
      hoverinfo: "x+y+text",
      fillcolor: '#2D2F33',
      jitter: 0.6,
      whiskerwidth: 0.6,
      marker: {
        opacity: 1,
        color: '#2D2F33',
        outliercolor: '#FF1654',
        line: {
          color: '#151313',
          outliercolor: '#FF1654',
          outlierwidth: 2
        }
      },
      boxpoints: 'suspectedoutliers'
    };
    this.outliersData = [this.outliersTrace];
    this.outliersLayout = {
      paper_bgcolor: 'rgb(250,250,250)',
      plot_bgcolor: 'rgb(250,250,250)',
      width: 300,
      height: 350,
      margin: {
        t: 30,
        b: 0
      },
      yaxis: {
        showgrid: true,
        zerolinecolor: '#C4BBB8'
      }
    };
  }

  chartSubsetEmit() {
    this.profileSubsetEmitter.emit(this.profileSubset);
  }

  // events barChart
  public barChartClicked(event): void {
    this.profileSubset.selection = event.name;
    this.profileSubset.chart = 1;
    this.chartSubsetEmit();
  }

  // events advancedPieChart
  public advancedPieChartClicked(event): void {
    if (event.name == 'Valid') {
      this.profileSubset.selection = 0;
    }
    else if (event.name == 'Invalid') {
      this.profileSubset.selection = 1;
    }
    else if (event.name == 'Outliers') {
      this.profileSubset.selection = 2;
    }
    this.profileSubset.chart = 2;
    this.chartSubsetEmit();
    console.log()
  }

}
