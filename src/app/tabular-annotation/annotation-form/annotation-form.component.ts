import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {AnnotationService} from '../annotation.service';
import {Observable} from 'rxjs/Observable';
import {AppConfig} from '../../app.config';
import {AbstractControl, FormControl, FormGroup, ValidatorFn, Validators} from '@angular/forms';
import {Annotation} from '../annotation.model';
import nlp from 'wink-nlp-utils';
import {HttpParams, HttpClient} from '@angular/common/http';

class CustomValidators {

  /**
   * Check if the langTag is valid, only if the datatype is equal to string.
   * @param {string} columnDatatype
   * @param {string} langTag
   * @returns {ValidatorFn}
   */
  static langTagValidator(columnDatatype: string, langTag: string): ValidatorFn {
    return (group: FormGroup): { [key: string]: any } => {
      const dataTypeControl = group.get(columnDatatype);
      const langTagControl = group.get(langTag);

      if (dataTypeControl && langTagControl) {
        const datatypeValue = dataTypeControl.value;
        const langTagValue = langTagControl.value;
        if (datatypeValue === 'string') {
          if (langTagValue.length === 0) {
            return {'invalidLangTag': {errorMessage: 'Language tag is required for strings'}}
          } else if (langTagValue.length !== 2) {
            return {'invalidLangTag': {errorMessage: 'Language tag must be of 2 chars'}}
          }
        }
        return null;
      }
    };
  }

  /**
   * Check if subject and property are both filled or empty
   * @param {string} subject
   * @param {string} property
   * @param {string} colValuesType
   * @returns {ValidatorFn}
   */
  static subjectPropertyValidator(subject: string, property: string, colValuesType: string): ValidatorFn {
    return (group: FormGroup): { [key: string]: any } => {
      const subjectControl = group.get(subject);
      const propertyControl = group.get(property);
      const columnValuesTypeControl = group.get(colValuesType);

      if (subjectControl && propertyControl && columnValuesTypeControl) {
        const subjectValue = subjectControl.value;
        const propertyValue = propertyControl.value;
        const valuesTypeValue = columnValuesTypeControl.value;

        if (subjectValue !== '' && propertyValue === '') {
          return {'invalidProperty': {errorMessage: 'A property requires a source column'}}
        }
        if (propertyValue !== '' && subjectValue === '') {
          return {'invalidSubject': {errorMessage: 'A source requires a property'}}
        }
        if (propertyValue === '' && subjectValue === '' && valuesTypeValue === ColumnTypes.Literal) {
          return {
            'invalidSubject': {errorMessage: 'Literal columns require a source'},
            'invalidProperty': {errorMessage: 'Literal columns require a property'}
          }
        }
        return null;
      }
    };
  }

  /**
   * Check if the selected source is contained in the array of allowed sources
   * @returns {ValidatorFn}
   */
  static subjectValidator(allowedSources: string[]): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} => {
      if (control.value !== '' && allowedSources && allowedSources.indexOf(control.value) === -1) {
        return {'invalidSubject': {errorMessage: 'This subject is not allowed'}}
      }
      return null;
    };
  }

  /**
   * Check if the selected URL is valid
   * @returns {ValidatorFn}
   */
  static URLValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} => {
      try {
        if (control.value !== '') {
          const url = new URL(control.value);
          if (url.host === '') {
            return {'invalidURL': {errorMessage: 'This URL is not valid'}};
          }
        }
        return null;
      } catch (error) {
        return {'invalidURL': {errorMessage: 'This URL is not valid'}}
      }
    };
  }

  static customDatatypeValidator(columnDatatype: string, customDatatype: string): ValidatorFn {
    return (group: FormGroup): { [key: string]: any } => {
      const dataTypeControl = group.get(columnDatatype);
      const customTypeControl = group.get(customDatatype);

      if (dataTypeControl && customTypeControl) {
        const datatypeValue = dataTypeControl.value;
        const customTypeValue = customTypeControl.value;
        if (datatypeValue === 'custom' && customTypeValue === '') {
          return {'invalidCustomDatatype': {errorMessage: 'A custom datatype must be specified'}}
        }
        return null;
      }
    };
  }

  static columnTypeValidator(columnType: string, columnValuesType: string): ValidatorFn {
    return (group: FormGroup): { [key: string]: any } => {
      const typeControl = group.get(columnType);
      const valuesTypeControl = group.get(columnValuesType);

      if (typeControl && valuesTypeControl) {
        const typeValue = typeControl.value;
        const valuesTypeValue = valuesTypeControl.value;
        if (valuesTypeValue === ColumnTypes.URI && typeValue === '') {
          return {'invalidColumnType': {errorMessage: 'A column type is required'}}
        }
        return null;
      }
    };
  }
}

const ColumnTypes = {
  URI: 'URI' as 'URI',
  Literal: 'Literal' as 'Literal',
};

const XSDDatatypes = {
  'byte': 'https://www.w3.org/2001/XMLSchema#byte',
  'short': 'https://www.w3.org/2001/XMLSchema#short',
  'integer': 'https://www.w3.org/2001/XMLSchema#int',
  'long': 'https://www.w3.org/2001/XMLSchema#integer',
  'decimal': 'https://www.w3.org/2001/XMLSchema#decimal',
  'float': 'https://www.w3.org/2001/XMLSchema#float',
  'double': 'https://www.w3.org/2001/XMLSchema#double',
  'boolean': 'https://www.w3.org/2001/XMLSchema#boolean',
  'date': 'https://www.w3.org/2001/XMLSchema#dateTime',
  'string': 'https://www.w3.org/2001/XMLSchema#string',
  'custom': ''
};

@Component({
  selector: 'app-annotation-form',
  templateUrl: './annotation-form.component.html',
  styleUrls: ['./annotation-form.component.css']
})
export class AnnotationFormComponent implements OnInit, OnDestroy {
  @Input() header: any;

  open = false;
  isSubject = false;
  isObject = false;
  submitted = false;

  private abstatPath;
  public annotation: Annotation;
  displayURINamespace = false;
  displayDatatype = false;
  displayType = false;
  displayLangTag = true; // because the default datatype is string
  displayCustomDatatype = false;

  allowedSources: string[];
  availableColumnValuesTypes = Object.keys(ColumnTypes);
  availableDatatypes = Object.keys(XSDDatatypes);

  annotationForm: FormGroup;

  static stringPreprocessing(string) {
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

  constructor(public annotationService: AnnotationService, private http: HttpClient, private config: AppConfig) {
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
    this.annotation = this.annotationService.getAnnotation(this.header);
    this.fillAllowedSourcesArray();
    this.buildForm();
    this.onChanges();
    if (this.annotation == null) {
      this.annotationsSuggestion();
      this.annotation = new Annotation();
    } else {
      this.setFormFromAnnotation();
    }
  }

  ngOnDestroy() {
    // Don't save anything since each valid annotation is already stored into the service
  }

  buildForm() {
    this.annotationForm = new FormGroup({
      columnInfo: new FormGroup({
        columnType: new FormControl('', CustomValidators.URLValidator()),
        columnValuesType: new FormControl('', Validators.required),
        urifyNamespace: new FormControl('', CustomValidators.URLValidator()),
        columnDatatype: new FormControl('string'),
        customDatatype: new FormControl('', CustomValidators.URLValidator()),
        langTag: new FormControl('en'),
      }),
      relationship: new FormGroup({
        subject: new FormControl('', CustomValidators.subjectValidator(this.allowedSources)),
        property: new FormControl('', CustomValidators.URLValidator()),
      }),
    }, Validators.compose([
      CustomValidators.langTagValidator('columnInfo.columnDatatype', 'columnInfo.langTag'),
      CustomValidators.subjectPropertyValidator('relationship.subject', 'relationship.property', 'columnInfo.columnValuesType'),
      CustomValidators.customDatatypeValidator('columnInfo.columnDatatype', 'columnInfo.customDatatype'),
      CustomValidators.columnTypeValidator('columnInfo.columnType', 'columnInfo.columnValuesType'),
      ]
    ));
  }

  setFormFromAnnotation() {
    this.annotationForm.get('relationship.subject').setValue(this.annotation.subject);
    this.annotationForm.get('relationship.property').setValue(this.annotation.property);

    const valuesType = this.annotation.columnValuesType;
    this.annotationForm.get('columnInfo.columnValuesType').setValue(valuesType);
    if (valuesType === ColumnTypes.URI) {
      this.annotationForm.get('columnInfo.columnType').setValue(this.annotation.columnType);
      this.annotationForm.get('columnInfo.urifyNamespace').setValue(this.annotation.urifyNamespace);
    } else if (valuesType === ColumnTypes.Literal) {
      const xsdDatatype = this.annotation.columnDatatype;
      let datatype = Object.keys(XSDDatatypes).find(key => XSDDatatypes[key] === xsdDatatype);
      if (!datatype) {
        datatype = 'custom';
      }
      this.annotationForm.get('columnInfo.columnDatatype').setValue(datatype);
      if (datatype === 'custom') {
        this.annotationForm.get('columnInfo.customDatatype').setValue(this.annotation.columnDatatype);
      }
      if (datatype === 'string') {
       this.annotationForm.get('columnInfo.langTag').setValue(this.annotation.langTag);
      }
    }
    this.isObject = this.annotation.subject !== '' && this.annotation.property !== '';
    this.annotationForm.markAsPristine();
    this.submitted = true;
  }

  resetForm() {
    this.annotationForm.reset({
      columnInfo: {
        columnType: '',
        columnValuesType: '',
        urifyNamespace: '',
        columnDatatype: 'string',
        columnCustomType: '',
        langTag: 'en',
      },
      relationship: {
        subject: '',
        property: '',
      }
    });
    this.annotation = new Annotation();
  }

  /**
   * Reset the annotation model when a submitted form changes
   */
  onChanges(): void {
    this.annotationForm.valueChanges.subscribe(valuesObj => {
      if (this.submitted) {
        let changed = false;
        const oldAnnotation = this.annotationService.getAnnotation(this.header);
        const literalProps = ['columnDatatype', 'customDatatype', 'langTag'];
        const URIProps = ['columnType', 'urifyNamespace'];
        const commonProps = ['subject', 'property'];

        const newValuesType = valuesObj.columnInfo.columnValuesType;
        if (newValuesType !== oldAnnotation.columnValuesType) { // check new type
          changed = true;
        }
        let i = 0;
        while (!changed && i < commonProps.length) { // check relationship
          const prop = commonProps[i];
          if (oldAnnotation.hasOwnProperty(prop)) {
            const oldValue = oldAnnotation[prop];
            const newValue = valuesObj['relationship'][prop];
            if (oldValue !== newValue) {
              changed = true;
            }
          }
          i++;
        }
        i = 0;
        if (newValuesType === ColumnTypes.URI) { // check URI properties
          while (!changed && i < URIProps.length) {
            const prop = URIProps[i];
            if (oldAnnotation.hasOwnProperty(prop)) {
              const oldValue = oldAnnotation[prop];
              const newValue = valuesObj['columnInfo'][prop];
              if (oldValue !== newValue) {
                changed = true;
              }
            }
            i++;
          }
        } else if (newValuesType === ColumnTypes.Literal) { // check Literal properties
          while (!changed && i < literalProps.length) {
            const prop = literalProps[i];
            if (oldAnnotation.hasOwnProperty(prop)) {
              const oldValue = oldAnnotation[prop];
              let newValue = valuesObj['columnInfo'][prop];
              if (prop === 'columnDatatype') {
                newValue = XSDDatatypes[newValue];
              }
              if (oldValue !== newValue) {
                changed = true;
              }
            }
            i++;
          }
        }

        if (changed) {
          this.submitted = false;
          this.annotation = new Annotation();
          this.annotationService.removeAnnotation(this.header);
        }
      }
    });
  }

  /**
   * A subject column must have URL as values type
   * @returns {boolean} true if this column is a subject and the values type is not URL. false otherwise.
   */
  subjectValuesTypeValidator() {
    return this.isSubject && this.annotationForm.get('columnInfo.columnValuesType').value !== ColumnTypes.URI
  }

  /**
   * Update form when column values type changes
   * @param columnDatatype
   */
  changeValuesType(columnDatatype) {
    const formElement = this.annotationForm.get('columnInfo.columnValuesType');
    formElement.setValue(columnDatatype);
    if (columnDatatype === ColumnTypes.URI) {
      this.displayURINamespace = true;
      this.displayDatatype = false;
      this.displayType = true;
      this.displayCustomDatatype = false;
    }
    if (columnDatatype === ColumnTypes.Literal) {
      if (this.annotationForm.get('columnInfo.columnDatatype').value === 'custom') {
        this.displayCustomDatatype = true;
      }
      this.displayType = false;
      this.displayURINamespace = false;
      this.displayDatatype = true;
    }
    formElement.markAsDirty();
  }

  /**
   * Update form when column datatype changes
   * @param datatype
   */
  changeDatatype(datatype) {
    const formElement = this.annotationForm.get('columnInfo.columnDatatype');
    formElement.setValue(datatype);
    this.displayLangTag = (datatype === 'string');
    this.displayCustomDatatype = (datatype === 'custom');
    formElement.markAsDirty();
  }

  /**
   * Set the value for the formElemement sourceColumn (it cannot be done automatically)
   * TODO: remove this method when Clarity will expose the autocomplete functionality
   * @param sourceColValue
   */
  changeSourceColumn(sourceColValue) {
    const formElement = this.annotationForm.get('relationship.subject');
    formElement.setValue(sourceColValue);
    formElement.markAsDirty();
  }

  /**
   * Apply changes to the annotation model when the form is submitted
   */
  onSubmit() {
    this.annotation.columnHeader = this.header;
    this.annotation.subject = this.annotationForm.get('relationship.subject').value;
    this.annotation.property = this.annotationForm.get('relationship.property').value;
    if (this.annotation.property['suggestion']) { // when user select a suggestion from the autocomplete
      this.annotation.property = this.annotation.property['suggestion'];
    }
    const valuesType = this.annotationForm.get('columnInfo.columnValuesType').value;
    this.annotation.columnValuesType = valuesType;
    if (valuesType === ColumnTypes.URI) {
      this.annotation.columnType = this.annotationForm.get('columnInfo.columnType').value;
      if (this.annotation.columnType['suggestion']) { // when user select a suggestion from the autocomplete
        this.annotation.columnType = this.annotation.columnType['suggestion'];
      }
      this.annotation.urifyNamespace = this.annotationForm.get('columnInfo.urifyNamespace').value;
    } else if (valuesType === ColumnTypes.Literal) {
      const datatype = this.annotationForm.get('columnInfo.columnDatatype').value;
      if (datatype === 'custom') {
        this.annotation.columnDatatype = this.annotationForm.get('columnInfo.customDatatype').value;
      } else {
        this.annotation.columnDatatype = XSDDatatypes[datatype];
        if (datatype === 'string') {
          this.annotation.langTag = this.annotationForm.get('columnInfo.langTag').value;
        }
      }
    }
    this.isObject = this.annotation.subject !== '' && this.annotation.property !== '';
    this.annotationService.setAnnotation(this.header, this.annotation);
    this.annotationForm.markAsPristine();
    this.submitted = true;
  }

  annotationsSuggestion() {
    // Preprocess the header before querying ABSTAT
    const filteredHeader = AnnotationFormComponent.stringPreprocessing(this.header);

    // Set first ABSTAT type suggestion as initial value
    this.typeSuggestions(filteredHeader).subscribe(suggestions => {
      if (suggestions.length > 0) {
        this.annotationForm.get('columnInfo.columnType').setValue(suggestions[0].suggestion);
      }
    });

    // Set first ABSTAT property suggestion as initial value
    this.propertySuggestions(filteredHeader).subscribe(suggestions => {
      if (suggestions.length > 0) {
        this.annotationForm.get('relationship.property').setValue(suggestions[0].suggestion);
      }
    });
  }

  deleteAnnotation() {
    this.resetForm();
    this.annotationService.removeAnnotation(this.header);
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
    if (keyword && position ) {

      const params = new HttpParams()
        .set('qString', keyword)
        .set('qPosition', position)
        .set('rows', '15')
        .set('start', '0');
      const url = this.abstatPath + '/api/v1/SolrSuggestions';

      return this.http
        .get(url, {params: params})
        .map(res => res['suggestions'])
    }
    return Observable.of([]);
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
    return `<p class="p6 no-margin-top">${data.suggestion}</p>
                <p class="p7 no-margin-top">${data.occurrence} occurrences</p>
                <p class="p7 no-margin-top">from: ${data.dataset}</p>`;
  };
}
