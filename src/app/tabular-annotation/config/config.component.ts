import { Component, Inject, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { AbstatService } from '../abstat.service';
import { AppConfig } from '../../app.config';

@Component({
  selector: 'app-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.css']
})
export class ConfigComponent implements OnInit {

  public summaries: any;
  public selectedEndpoint: any;
  public abstatEndpointsNames: string[];
  public abstatEndpoints: Map<string, string>;
  public advancedSettings: boolean;

  constructor(private abstat: AbstatService, private config: AppConfig) {
  }

  ngOnInit() {
    this.advancedSettings = false;
    this.abstatEndpoints = new Map<string, string>();
    this.abstatEndpoints.set('ABSTAT-UNIMIB', this.config.getConfig('abstat-path'));
    this.abstatEndpoints.set('ABSTAT-POLIBA', this.config.getConfig('abstat-path-ba'));
    this.abstatEndpointsNames = Array.from(this.abstatEndpoints.keys());
    this.abstatEndpoints.forEach((value, key) => {
      if (value === this.abstat.getCurrentEndpoint()) {
        this.selectedEndpoint = key;
      }
    });
    this.summaries = [];
    const existingSummaries = this.abstat.getPreferredSummaries();
    if (existingSummaries) {
      existingSummaries.forEach(summary => this.summaries.push({ summary_name: summary, display: summary, value: summary }));
    }
  }

  public abstatAvailableSummaries = (): Observable<Response> => {
    return this.abstat.listSummaries();
  }

  // Data format: [0: {URI: "http://ld-summaries.org/sdati-3", summary_name: "sdati-3", display: "sdati-3", value: "sdati-3"}, ...]
  public save() {
    const summariesList = [];
    this.summaries.forEach(tag => summariesList.push(tag.summary_name));
    this.abstat.updatePreferredSummaries(summariesList);
    this.abstat.updateEndpoint(this.abstatEndpoints.get(this.selectedEndpoint));
  }
}
