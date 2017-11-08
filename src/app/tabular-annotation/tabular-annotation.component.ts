import {
  Component, OnInit, ViewChild, Input, Output, EventEmitter,
  OnDestroy, AfterContentChecked, AfterViewChecked, ElementRef
} from '@angular/core';
import { TabularAnnotationDetailComponent } from './tabular-annotation-detail.component';
import { Router, RouterModule } from '@angular/router';
import { Http, Response } from '@angular/http';
import { Annotation, AnnotationService } from './annotation.service';
import { forEach } from '@angular/router/src/utils/collection';
import { isUndefined } from 'util';
import { Observable } from 'rxjs';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/switch';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/fromEvent';

@Component({
  selector: 'tabular-annotation',
  templateUrl: './tabular-annotation.component.html',
  styleUrls: ['./tabular-annotation.component.css'],
  providers: [AnnotationService]
})
export class TabularAnnotationComponent implements OnInit {

  @ViewChild(TabularAnnotationDetailComponent) detailMode: TabularAnnotationDetailComponent;

  @Input() colId: number;
  @Input() colContent: any[];
  @Input() header: any;

  objectMarker = 'shade';
  subjectMarker = 'shade';
  myData = 'primo';
  open = false;
  isSubject = false;

  public annotation: Annotation;
  // public source: String;
  // public sourceLabel: String;
  // public property: String;
  // public propertyLabel: String\;
  // public columnType: String;
  // public columnTypeLabel: String;
  // public isSubject: Boolean;
  public first = false;
  typeSuggestions = 'http://abstat.disco.unimib.it/api/v1/SolrSuggestions?query=:keyword,subj&rows=15&start=0';
  propertySuggestions = 'http://abstat.disco.unimib.it/api/v1/SolrSuggestions?query=:keyword,pred&rows=15&start=0';
  listOfSubjects: string[] = [];
  colName;
  annotated: boolean = false;
  hasSourcePropertyError: boolean = false;
  hasPropertySourceError: boolean = false;
  sourcePropertyError: string = "Both property and source must be filled";
  hasColumnTypeError: boolean = false;
  columnTypeError: string = "Column type is required";
  hasUrlLiteralError: boolean = false;
  urlLiteralError: string = "A column values type must be chosen";
  hasSubjectError: boolean = false;
  subjectErrorBase: string = "Column values type must be an URL because is the source column of columns: ";
  subjectError: string = "";
  hasSourceError: boolean;
  sourceError: string = "Insert a valid source column";
  hasUrlError: boolean = false;
  urlError: string = "URL not valid";

  urlREGEX: RegExp = new RegExp('(ftp|http|https):\/\/[^ "]+$');
  urlREGEX2: RegExp = new RegExp('/(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/');

  constructor(public annotationService: AnnotationService, public http: Http) {
    this.annotationService.subjectsChange.subscribe(subjects => {
      this.subjectMarker = 'shade';
      this.annotation.isSubject = false;
      let i = 0;
      let subjectsLabel = [];
      subjects.forEach((value: String) => {
        if (value === this.colName) {
          this.subjectMarker = 'inverse';
          this.annotation.isSubject = true;
          if (this.annotation.columnDataType !== "URL") {
            console.log(this.annotation.columnDataType);
            this.hasSubjectError = true;
            this.annotated = false;
            subjectsLabel.push(i);
          }
        }
        i++;
      });
      this.subjectError = this.subjectErrorBase + subjectsLabel.join(", ");
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
    if (columnType == "") {
      this.hasColumnTypeError = true;
    }
    if (this.annotation.columnDataType == "") {
      this.hasUrlLiteralError = true;
    }
    if (source != "" && property == "") {
      this.hasPropertySourceError = true;
    }
    if ((source == "" && property != "")) {
      this.hasSourcePropertyError = true;
    }
    return !this.hasUrlLiteralError && !this.hasSourcePropertyError && !this.hasColumnTypeError;
  }

  saveChangesSmall(colId) {
    let source = this.getInputValue(colId, ".Source");
    let property = this.getInputValue(colId, ".Property");
    let columnType = this.getInputValue(colId, ".ColumnType");
    if (this.validation(source, property, columnType)) {
      this.annotation.index = colId;
      this.annotation.source = source;
      this.annotation.property = property;
      this.annotation.columnType = columnType;

      if (this.annotation.source !== '' && this.annotation.property !== '' && this.annotation.columnType !== '') {
        this.objectMarker = 'inverse';
        console.log('OBJECT');
      }
      this.annotated = true;
      this.annotationService.setAnnotation(this.colId, this.annotation);
    }
  }


  goToDetailMode() {
    this.annotationService.colContent = this.colContent;
    this.annotationService.header = this.header;
    this.annotationService.colNum = this.colId;
  }

  subjectSelect(isSubject) {
    if (isSubject == 'O') {
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
    while ((<HTMLInputElement>temp[i]).getAttribute('data-value') !== string) {
      i++;
    }
    return (<HTMLInputElement>temp[i]).value;
  }


  propertyAutocomplete() {
    // console.log("dentro");
    const word = this.getInputValue(this.colId, '.Property');

    this.annotationService.abstatAutofill(word, 'pred', 100, 0).subscribe();

    this.propertySuggestions = this.annotationService.suggestion;
    console.log(this.propertySuggestions);

  }

  getSubjects() {
    this.listOfSubjects = [];
    for (let i = 0; i < this.annotationService.colNames.length; i++) {
      if (this.annotationService.colNames[i] !== this.colName) {
        this.listOfSubjects.push(this.annotationService.colNames[i]);
      }
    }
  }

  subjectValidate(partialSubject) {
    return this.annotation.source === "" || (this.listOfSubjects.indexOf(partialSubject) > -1);
  }

  validateURL(url) {
    return url === "" || this.urlREGEX.test(<string>url);
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
    return this.hasErrors() || this.annotation.source === "" || this.annotation.columnDataType === ""
  }

}
