import {Component, OnInit} from '@angular/core';
import {Observable} from 'rxjs';
import {AsiaMasService} from '../asia-mas/asia-mas.service';
import {Suggester} from '../asia-mas/asia-mas.model';

@Component({
  selector: 'app-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.css']
})
export class ConfigComponent implements OnInit {

  private summaries: any;

  public preferredSummaries: any;
  public suggester: Suggester;
  public suggesters = Object.keys(Suggester);

  constructor(private suggesterSvc: AsiaMasService) { }

  ngOnInit() {
    this.suggester = this.suggesterSvc.getSuggester();
    this.preferredSummaries = this.suggesterSvc.getPreferredSummaries().map(summary => ({ display: summary, value: summary }));
    this.fetchSummaries();
  }

  private fetchSummaries() {
    this.suggesterSvc.getSummaries(this.suggester).subscribe((data) => {
      this.summaries = data;
    });
  }

  private update() {
    this.preferredSummaries = [];
    this.fetchSummaries();
  }

  public getSummaries = (): Observable<Object> => {
    return Observable.of(this.summaries);
  }

  // Data format: [0: {display: "sdati-3", value: "sdati-3"}, ...]
  public save() {
    this.suggesterSvc.setSuggester(this.suggester);
    console.log(this.preferredSummaries);
    this.suggesterSvc.setPreferredSummaries(this.preferredSummaries.map(tag => tag.value));
  }
}
