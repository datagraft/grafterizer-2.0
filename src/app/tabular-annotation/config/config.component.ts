import {Component, Inject, OnInit} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {AbstatService} from '../abstat.service';

@Component({
  selector: 'app-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.css']
})
export class ConfigComponent implements OnInit {

  public summaries: any;

  constructor(private abstat: AbstatService) {
  }

  ngOnInit() {
    this.summaries = [];
    const existingSummaries = this.abstat.getPreferredSummaries();
    if (existingSummaries) {
      existingSummaries.forEach(summary => this.summaries.push({summary_name: summary,  display: summary, value: summary}));
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
  }
}
