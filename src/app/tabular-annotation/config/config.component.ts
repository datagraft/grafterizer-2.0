import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {Observable} from 'rxjs';
import {AsiaMasService} from '../asia-mas/asia-mas.service';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {MatChipInputEvent} from '@angular/material/chips';
import {MatAutocomplete, MatAutocompleteSelectedEvent} from '@angular/material/autocomplete';
import {FormControl} from '@angular/forms';
import {map, startWith} from 'rxjs/operators';

@Component({
  selector: 'app-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.css']
})
export class ConfigComponent implements OnInit {

  visible = true;
  selectable = true;
  removable = true;
  addOnBlur = true;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  summaryCtrl = new FormControl();
  filteredSummaries: Observable<string[]>;
  preferredSummaries = [];
  summaries: any = [];

  @ViewChild('auto') matAutocomplete: MatAutocomplete;
  @ViewChild('summaryInput') summaryInput: ElementRef<HTMLInputElement>;

  public suggester: string;
  public suggesters: any = [];
  public language: string;
  public languages: any = [];

  constructor(private suggesterSvc: AsiaMasService) {
    this.filteredSummaries = this.summaryCtrl.valueChanges.pipe(
      startWith(null),
      map((summary: string | null) => summary ? this._filter(summary) : this._availableSummaries.slice()));
  }

  ngOnInit() {
    this.suggesterSvc.getSuggestersList().subscribe((data) => {
      this.suggesters = data;
      this.suggester = this.suggesterSvc.getSuggester() || this.suggesters[0];
      this.preferredSummaries = this.suggesterSvc.getPreferredSummaries();
      this.fetchSummaries();
    });
    this.suggesterSvc.getLanguagesList().subscribe((data) => {
      this.languages = data;
      this.language = this.suggesterSvc.getLanguage() || this.languages[0];
    });
  }

  private fetchSummaries() {
    this.suggesterSvc.getSummariesList(this.suggester).subscribe((data) => {
      this.summaries = data;
    });
  }

  private update() {
    this.preferredSummaries = [];
    this.fetchSummaries();
  }

  public save() {
    this.suggesterSvc.setSuggester(this.suggester);
    this.suggesterSvc.setLanguage(this.language);
    this.suggesterSvc.setPreferredSummaries(Array.from(this.preferredSummaries));
  }

  remove(summary: string): void {
    const index = this.preferredSummaries.indexOf(summary);

    if (index >= 0) {
      this.preferredSummaries.splice(index, 1);
    }
  }

  add(event: MatChipInputEvent): void {
    // Add summary only when MatAutocomplete is not open
    // To make sure this does not conflict with OptionSelected Event
    if (!this.matAutocomplete.isOpen) {
      const input = event.input;
      const value = event.value;

      // Add the summary if
      // - it does not already exist
      // - it comes from the summaries list
      if ((value || '').trim() && this._availableSummaries.indexOf(value.trim()) > 0) {
        this.preferredSummaries.push(value.trim());
      }

      // Reset the input value
      if (input) {
        input.value = '';
      }

      this.summaryCtrl.setValue(null);
    }
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    this.preferredSummaries.push(event.option.viewValue);
    this.summaryInput.nativeElement.value = '';
    this.summaryCtrl.setValue(null);
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this._availableSummaries.filter(summary => summary.toLowerCase().indexOf(filterValue) === 0);
  }

  get _availableSummaries(): string[] {
    return this.summaries.filter(summary => this.preferredSummaries.indexOf(summary) === -1);
  }
}

