import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {TabularAnnotationDetailComponent} from '../tabular-annotation-detail.component';
import {Annotation, AnnotationService} from '../annotation.service';
import {Http} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import {AppConfig} from '../../app.config';

@Component({
  selector: 'app-annotation-form',
  templateUrl: './annotation-form.component.html',
  styleUrls: ['./annotation-form.component.css']
})
export class AnnotationFormComponent implements OnInit, OnDestroy {

  @ViewChild(TabularAnnotationDetailComponent) detailMode: TabularAnnotationDetailComponent;

  @Input() colId: number;
  @Input() header: any;

  open = false;
  isSubject = false;
  isObject = false;

  private abstatPath;
  public annotation: Annotation;
  // public source: String;
  // public sourceLabel: String;
  // public property: String;
  // public propertyLabel: String\;
  // public columnType: String;
  // public columnTypeLabel: String;
  // public isSubject: Boolean;
  public first = false;
  listOfSubjects: string[] = [];
  colName;
  annotated = false;
  hasSourcePropertyError = false;
  hasPropertySourceError = false;
  sourcePropertyError = 'Both property and source must be filled';
  hasColumnTypeError = false;
  columnTypeError = 'Column type is required';
  hasUrlLiteralError = false;
  urlLiteralError = 'A column values type must be chosen';
  hasSubjectError = false;
  subjectErrorBase = 'Column values type must be an URL because is the source column of column: ';
  subjectError = '';
  hasSourceError: boolean;
  sourceError = 'Insert a valid source column';
  hasUrlError = false;
  urlError = 'URL not valid';

  urlREGEX: RegExp = new RegExp('(ftp|http|https):\/\/[^ "]+$');
  urlREGEX2: RegExp = new RegExp('/(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/');

  constructor(public annotationService: AnnotationService, public http: Http, private config: AppConfig) {
    this.abstatPath = this.config.getConfig('abstat-path');
    this.annotationService.subjectsChange.subscribe(subjects => {
      this.annotation.isSubject = false;
      let i = 0;
      const subjectsLabel = [];
      subjects.forEach((value: String) => {
        if (value === this.colName) {
          this.isSubject = true;
          this.annotation.isSubject = true;
          if (this.annotation.columnDataType !== 'URL') {
            console.log(this.annotation.columnDataType);
            this.hasSubjectError = true;
            this.annotated = false;
            subjectsLabel.push(i);
          }
        }
        i++;
      });
      this.subjectError = this.subjectErrorBase + subjectsLabel.join(', ');
    });
  }

  ngOnInit() {
    this.annotation = new Annotation();
    this.colName = this.colId.toString().concat(': ', this.header);
    if (this.annotationService.isFull) {
      console.log('is full');
      this.annotation = this.annotationService.getAnnotation(this.colId);
    }
    this.getSubjects();
    console.log(this.annotation.columnDataType);
  }

  ngOnDestroy() {
    console.log('destroy annotation form');
    this.annotationService.setAnnotation(this.colId, this.annotation);
    this.annotationService.isFull = true;
    //   this.annotationService.isSubject[this.colId] = this.isSubject;
    //   this.annotationService.source[this.colId] = this.source;
    //   this.annotationService.sourceLabel[this.colId] = this.sourceLabel
    //   this.annotationService.property[this.colId] = this.property;
    //   this.annotationService.propertyLabel[this.colId] = this.propertyLabel;
    //   this.annotationService.columnType[this.colId] = this.columnType;
    //   this.annotationService.columnTypeLabel[this.colId] = this.columnTypeLabel;
    //
  }

  // dataTypeURL() {
  //   this.columnType = "URL";
  // }

  // dataTypeLiteral() {
  //   this.columnType = "Literal";
  // }

  validation(source, property, columnType) {
    this.hasColumnTypeError = false;
    this.hasSourcePropertyError = false;
    this.hasUrlLiteralError = false;
    this.hasSubjectError = false;
    if (columnType === '') {
      this.hasColumnTypeError = true;
    }
    if (this.annotation.columnDataType === '') {
      this.hasUrlLiteralError = true;
    }
    if (source !== '' && property === '') {
      this.hasPropertySourceError = true;
    }
    if ((source === '' && property !== '')) {
      this.hasSourcePropertyError = true;
    }
    return !this.hasUrlLiteralError && !this.hasSourcePropertyError && !this.hasColumnTypeError;
  }

  saveChangesSmall(colId) {
    const source = this.getInputValue(colId, '.Source');
    const property = this.getInputValue(colId, '.Property');
    const columnType = this.getInputValue(colId, '.ColumnType');
    if (this.validation(source, property, columnType)) {
      this.annotation.index = colId;
      this.annotation.source = source;
      this.annotation.property = property;
      this.annotation.columnType = columnType;

      if (this.annotation.source !== '' && this.annotation.property !== '' && this.annotation.columnType !== '') {
        this.isObject = true;
      }
      this.annotated = true;
      this.annotationService.setAnnotation(this.colId, this.annotation);
    }
  }

  goToDetailMode() {
    // this.annotationService.colContent = this.colContent;
    // this.annotationService.header = this.header;
    // this.annotationService.colNum = this.colId;
  }

  subjectSelect(isSubject) {
    if (isSubject === 'O') {
      this.annotation.isSubject = false;
    } else {
      this.annotation.isSubject = true;
    }
  }

  dataTypeSelect(dataType) {
    this.annotation.columnDataType = dataType;
    this.annotated = false;
  }

  getInputValue(colId, selector) {
    const temp = (document.querySelectorAll('[data-value]'));
    let i = 0;
    const string = ''.concat(colId, selector);
    while ((<HTMLInputElement> temp[i]).getAttribute('data-value') !== string) {
      i++;
    }
    return (<HTMLInputElement> temp[i]).value;
  }

  // propertyAutocomplete() {
  //   // console.log("dentro");
  //   const word = this.getInputValue(this.colId, '.Property');
  //
  //   this.annotationService.abstatAutofill(word, 'pred', 100, 0).subscribe();
  //
  //   this.propertySuggestions = this.annotationService.suggestion;
  //   console.log(this.propertySuggestions);
  // }

  getSubjects() {
    this.listOfSubjects = [];
    for (let i = 0; i < this.annotationService.colNames.length; i++) {
      if (this.annotationService.colNames[i] !== this.colName) {
        this.listOfSubjects.push(this.annotationService.colNames[i]);
      }
    }
  }

  subjectValidate(partialSubject) {
    return this.annotation.source === '' || (this.listOfSubjects.indexOf(partialSubject) > -1);
  }

  validateURL(url) {
    return url === '' || this.urlREGEX.test(<string> url);
  }

  invalidateAnnotation() {
    this.annotated = false;
  }

  returnUrlError() {
    this.annotated = false;
    this.hasUrlError = true;
    this.hasErrors();
    return this.urlError;
  }

  hasErrors() {
    return this.hasSubjectError || this.hasUrlLiteralError || this.hasColumnTypeError ||
      this.hasSourcePropertyError || this.hasSourceError || this.hasPropertySourceError || this.hasUrlError;
  }

  disabledErrors() {
    return this.hasErrors() || this.annotation.source === '' || this.annotation.columnDataType === ''
  }

  abstatSuggestions(keyword, position) {
    const url =
      this.abstatPath + '/api/v1/SolrSuggestions?qString=' + keyword + '&qPosition=' + position + '&rows=15&start=0';
    if (keyword) {
      return this.http.get(url)
        .map(res => {
          const json = res.json();
          return json.suggestions;
        })
    } else {
      return Observable.of([]);
    }
  }

  typeSuggestions = (keyword: any): Observable<any[]> => {
    return this.abstatSuggestions(keyword, 'subj')
  };

  propertySuggestions = (keyword: any): Observable<any[]> => {
    return this.abstatSuggestions(keyword, 'prop')
  };

  autocompleteListFormatter = (data: any) => {
    const html = `<p class="p6 no-margin-top">${data.suggestion}</p>
                <p class="p7 no-margin-top">${data.occurrence} occurrences</p>
                <p class="p7 no-margin-top">from: ${data.dataset}</p>`;
    return html;
  }
}
