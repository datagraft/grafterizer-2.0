import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';

@Component({
  selector: 'adv-pie-chart',
  templateUrl: './adv-pie-chart.component.html',
  styleUrls: ['./adv-pie-chart.component.css']
})
export class AdvPieChartComponent implements OnInit {

  @Output() done: EventEmitter<any> = new EventEmitter();

  private valid: number;
  private missing: number;
  private view: any[] = undefined;
  private data;
  private colorScheme = {
    domain: ['#5AA454', '#A10A28']
  };

  constructor() {
  }

  ngOnInit() {

    //setting the charts height based on window size height
    let height = window.screen.height;
    let width = document.getElementById("visual-container").getBoundingClientRect().width;
    let charts = document.getElementsByClassName("chart") as HTMLCollectionOf<HTMLElement>;
    for (let c in charts) {
      if (charts[c].style != undefined) {
        charts[c].style.height = height / 3 + "px";
        charts[c].style.width = width / 3 + "px";
      }
    }

  }

  @Input()
  set chartData(data: any) {
    this.data = [
      {
        "name": "Valid",
        "value": data.valid
      },
      {
        "name": "Missing",
        "value": data.missing
      }
    ];
    this.done.emit(null);
  }


}
