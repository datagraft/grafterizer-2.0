import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {TabularAnnotationDetailComponent} from '../tabular-annotation-detail.component';
import {AnnotationService} from '../annotation.service';
import {Http} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import {AppConfig} from '../../app.config';
import {AbstractControl, FormControl, FormGroup, ValidatorFn, Validators} from '@angular/forms';
import {Annotation} from '../annotation.model';

@Component({
  selector: 'app-annotation-form',
  templateUrl: './annotation-form.component.html',
  styleUrls: ['./annotation-form.component.css']
})
export class AnnotationFormComponent implements OnInit, OnDestroy {

  @ViewChild(TabularAnnotationDetailComponent) detailMode: TabularAnnotationDetailComponent;

  @Input() header: any;

  open = false;
  isSubject = false;
  isObject = false;
  submitted = false;

  private abstatPath;
  public annotation: Annotation;
  public first = false;
  prefixRequired = false;

  allowedSources: string[];

  urlREGEX: RegExp = new RegExp('(ftp|http|https):\/\/[^ "]+$');
  urlREGEX2: RegExp = new RegExp('/(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/');

  annotationForm: FormGroup;

  constructor(public annotationService: AnnotationService, public http: Http, private config: AppConfig) {
    this.abstatPath = this.config.getConfig('abstat-path');
    this.annotationService.subjectsChange.subscribe(subjects => {
      this.isSubject = false;
      let i = 0;
      const subjectsLabel = [];
      this.prefixRequired = false;
      subjects.forEach((value: String) => {
        if (value === this.header) {
          this.isSubject = true;
          if (this.annotation.columnValuesType !== 'URL') {
            this.prefixRequired = true;
            subjectsLabel.push(i);
          }
        }
        i++;
      });
    });
  }

  ngOnInit() {
    this.annotationForm = new FormGroup({
      columnInfo: new FormGroup({
        columnType: new FormControl('', [
          Validators.required,
          Validators.pattern(this.urlREGEX)
        ]),
        columnValuesType: new FormControl('', Validators.required),
        urifyPrefix: new FormControl('', Validators.pattern(this.urlREGEX)),
      }),
      relationship: new FormGroup({
        subject: new FormControl('', this.forbiddenSubjectValidator()),
        property: new FormControl('', Validators.pattern(this.urlREGEX)),
      }),
    });
    this.onChanges();

    /**
     * Set first ABSTAT type suggestion as initial value
     */
    this.typeSuggestions(this.header).subscribe(suggestions => {
      if (suggestions.length > 0) {
        this.annotationForm.get('columnInfo').get('columnType').setValue(suggestions[0].suggestion);
      }
    });

    /**
     * Set first ABSTAT property suggestion as initial value
     */
    this.propertySuggestions(this.header).subscribe(suggestions => {
      if (suggestions.length > 0) {
        this.annotationForm.get('relationship').get('property').setValue(suggestions[0].suggestion);
      }
    });

    this.annotation = new Annotation();
    if (this.annotationService.isFull) {
      this.annotation = this.annotationService.getAnnotation(this.header);
    }
    this.fillAllowedSourcesArray();
  }

  ngOnDestroy() {
    this.annotationService.setAnnotation(this.header, this.annotation);
    this.annotationService.isFull = true;
  }

  /**
   * Reset the annotation model when the form changes
   */
  onChanges(): void {
    this.annotationForm.valueChanges.subscribe(val => {
      this.submitted = false;
      this.annotation = new Annotation();
    });
  }

  /**
   * Check if the prefix URI is missing
   * @returns {boolean} true if the prefix is required but still empty
   */
  missingPrefix() {
    return this.prefixRequired && this.annotationForm.get('columnInfo').get('urifyPrefix').value === '';
  }

  /**
   * Validator that checks if the selected source is contained in the array of allowed sources
   * @returns {ValidatorFn}
   */
  forbiddenSubjectValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} => {
      const forbidden = control.value !== '' && this.allowedSources.indexOf(control.value) === -1;
      return forbidden ? {'forbiddenSubject': {value: control.value}} : null;
    };
  }

  /**
   * Property must be filled in if the subject is set.
   * @returns {boolean} true if property is empty and subject is filled, false otherwise.
   */
  emptyPropertyValidator() {
    return this.annotationForm.get('relationship').get('subject').value !== '' &&
      this.annotationForm.get('relationship').get('property').value === '';
  }

  /**
   * Subject must be filled in if the property is set.
   * @returns {boolean} true if subject is empty and property is filled, false otherwise.
   */
  emptySubjectValidator() {
    return this.annotationForm.get('relationship').get('subject').value === '' &&
      this.annotationForm.get('relationship').get('property').value !== '';
  }

  /**
   * Validate form when column values type changes
   * @param columnDataType
   */
  changeValuesType(columnDataType) {
    const formElement = this.annotationForm.get('columnInfo').get('columnValuesType');
    formElement.setValue(columnDataType);
    if (columnDataType === 'URL') {
      this.prefixRequired = false;
      this.annotationForm.get('columnInfo').get('urifyPrefix').setValue('');
    } else if (this.isSubject) {
      this.prefixRequired = true;
    }
    formElement.markAsDirty();
  }

  /**
   * Set the value for the formElemement sourceColumn (it cannot be done automatically)
   * TODO: remove this method when Clarity will expose the autocomplete functionality
   * @param sourceColValue
   */
  changeSourceColumn(sourceColValue) {
    const formElement = this.annotationForm.get('relationship').get('subject');
    formElement.setValue(sourceColValue);
    formElement.markAsDirty();
  }

  /**
   * Apply changes to the annotation model when the form is submitted
   */
  onSubmit() {
    this.annotation.sourceColumnHeader = this.annotationForm.get('relationship').get('subject').value;
    this.annotation.property = this.annotationForm.get('relationship').get('property').value;
    this.annotation.columnType = this.annotationForm.get('columnInfo').get('columnType').value;
    this.annotation.columnValuesType = this.annotationForm.get('columnInfo').get('columnValuesType').value;
    this.annotation.urifyPrefix = this.annotationForm.get('columnInfo').get('urifyPrefix').value;
    this.isObject = this.annotation.sourceColumnHeader !== '' && this.annotation.property !== '' && this.annotation.columnType !== '';
    this.annotationService.setAnnotation(this.header, this.annotation);
    this.annotationForm.markAsPristine();
    this.submitted = true;
  }

  resetForm() {
    this.annotationForm.reset();
    this.annotation = new Annotation();
  }

  deleteAnnotation() {
    this.resetForm();
    this.annotationService.setAnnotation(this.header, new Annotation());
  }

  /**
   * TODO: detail mode is not implemented yet
   */
  goToDetailMode() {
    // this.annotationService.colContent = this.colContent;
    // this.annotationService.header = this.header;
    // this.annotationService.colNum = this.colId;
  }

  /**
   * Fill the subjects array with all columns that can be selected as source of this column
   * The array contains all table columns, except this column
   */
  fillAllowedSourcesArray() {
    this.allowedSources = [];
    this.annotationService.headers.forEach((h: string) => {
      if (h !== this.header) {
        this.allowedSources.push(h);
      }
    });
  }

  /**
   * Get suggestions from ABSTAT
   * TODO: change the URI with ASIA path
   * @param keyword
   * @param position
   * @returns {any}
   */
  abstatSuggestions(keyword, position) {
    const url =
      this.abstatPath + '/api/v1/SolrSuggestions?qString=' + keyword + '&qPosition=' + position + '&rows=15&start=0';
    if (keyword && position) {
      return this.http.get(url)
        .map(res => {
          return res.json().suggestions;
        })
    } else {
      return Observable.of([]);
    }
  }

  /**
   * Search for type suggestions
   * @param keyword
   * @returns {Observable<any[]>}
   */
  typeSuggestions = (keyword: any): Observable<any[]> => {
    return this.abstatSuggestions(keyword, 'subj')
  };

  /**
   * Search for property suggestions
   * @param keyword
   * @returns {Observable<any[]>}
   */
  propertySuggestions = (keyword: any): Observable<any[]> => {
    return this.abstatSuggestions(keyword, 'pred')
  };

  /**
   * Custom rendering of autocomplete list
   * @param data
   * @returns {string}
   */
  autocompleteListFormatter = (data: any) => {
    const html = `<p class="p6 no-margin-top">${data.suggestion}</p>
                <p class="p7 no-margin-top">${data.occurrence} occurrences</p>
                <p class="p7 no-margin-top">from: ${data.dataset}</p>`;
    return html;
  };
}
