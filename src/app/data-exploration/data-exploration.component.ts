import { Component, OnInit } from '@angular/core';
import * as datalib from 'datalib';

@Component({
  selector: 'data-exploration',
  templateUrl: './data-exploration.component.html',
  styleUrls: ['./data-exploration.component.css']
})
export class DataExplorationComponent implements OnInit {

  constructor() { }

  ngOnInit() {
    const libVoyager = require('datavoyager');

    const container = document.getElementById('voyager-container');
    const config = {
      showDataSourceSelector: true,
      serverUrl: null,
      manualSpecificationOnly: false,
      hideHeader: true,
      hideFooter: false
    };

    let csvData = datalib.csv('https://raw.githubusercontent.com/vega/vega-datasets/gh-pages/data/seattle-weather.csv');
    const voyagerInstance = libVoyager.CreateVoyager(container, config, { "values": csvData });

  }

}
