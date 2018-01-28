import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {TabularAnnotationDetailComponent} from '../tabular-annotation-detail.component';
import {AnnotationService} from '../annotation.service';
import {Http} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import {AppConfig} from '../../app.config';
import {AbstractControl, FormControl, FormGroup, ValidatorFn, Validators} from '@angular/forms';
import {Annotation} from '../annotation.model';
import nlp from 'wink-nlp-utils';

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
      subjects.forEach((value: String) => {
        if (value === this.header) {
          this.isSubject = true;
          subjectsLabel.push(i);
          if (this.subjectValuesTypeValidator()) {
            this.submitted = false;
            this.annotationService.removeAnnotation(this.header);
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
     * Preprocess the header before querying ABSTAT
     */
    const filteredHeader = this.stringPreprocessing(this.header);

    /**
     * Set first ABSTAT type suggestion as initial value
     */
    this.typeSuggestions(filteredHeader).subscribe(suggestions => {
      if (suggestions.length > 0) {
        this.annotationForm.get('columnInfo').get('columnType').setValue(suggestions[0].suggestion);
      }
    });

    /**
     * Set first ABSTAT property suggestion as initial value
     */
    this.propertySuggestions(filteredHeader).subscribe(suggestions => {
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
      this.annotationService.removeAnnotation(this.header);
    });
  }

  stringPreprocessing(string) {
    // remove special chars (e.g. _)
    string = nlp.string.retainAlphaNums(string);
    // split camelCase words
    string = string
      // insert a space between lower & upper
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      // space before last upper in a sequence followed by lower
      .replace(/\b([A-Z]+)([A-Z])([a-z])/, '$1 $2$3')
      // uppercase the first character
      .replace(/^./, function(str){ return str.toUpperCase(); });
    // tokenize string
    let tokens = nlp.string.tokenize(string);
    // remove stop words
    tokens = nlp.tokens.removeWords(tokens);
    // create string from tokens
    string = tokens.join(' ');
    return string;
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
   * A subject column must have URL as values type
   * @returns {boolean} true if this column is a subject and the values type is not URL. false otherwise.
   */
  subjectValuesTypeValidator() {
    return this.isSubject && this.annotationForm.get('columnInfo').get('columnValuesType').value !== 'URL'
  }

  /**
   * Validate form when column values type changes
   * @param columnDataType
   */
  changeValuesType(columnDataType) {
    const formElement = this.annotationForm.get('columnInfo').get('columnValuesType');
    formElement.setValue(columnDataType);
    if (columnDataType === 'URL') {
      this.prefixRequired = true;
      this.annotationForm.get('columnInfo').get('urifyPrefix').setValue('');
    } else {
      this.prefixRequired = false;
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
    this.annotation.columnHeader = this.header;
    this.annotation.sourceColumnHeader = this.annotationForm.get('relationship').get('subject').value;
    this.annotation.property = this.annotationForm.get('relationship').get('property').value;
    if (this.annotation.property['suggestion']) { // when user select a suggestion from the autocomplete
      this.annotation.property = this.annotation.property['suggestion'];
    }
    this.annotation.columnType = this.annotationForm.get('columnInfo').get('columnType').value;
    if (this.annotation.columnType['suggestion']) { // when user select a suggestion from the autocomplete
      this.annotation.columnType = this.annotation.columnType['suggestion'];
    }
    this.annotation.columnValuesType = this.annotationForm.get('columnInfo').get('columnValuesType').value;
    this.annotation.urifyPrefix = this.annotationForm.get('columnInfo').get('urifyPrefix').value;
    this.isObject = this.annotation.sourceColumnHeader !== '' && this.annotation.property !== '' && this.annotation.columnType !== '';
    this.annotationService.setAnnotation(this.header, this.annotation);
    this.annotationForm.markAsPristine();
    this.submitted = true;
  }

  resetForm() {
    this.annotationForm.reset({
      columnInfo: {
        columnType: '',
        columnValuesType: '',
        urifyPrefix: '',
      },
      relationship: {
        subject: '',
        property: '',
      }
    });
    this.annotation = new Annotation();
  }

  deleteAnnotation() {
    this.resetForm();
    this.annotationService.removeAnnotation(this.header);
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
