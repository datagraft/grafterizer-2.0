import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

// here I create the Annotation Class, with attributes and set/get
export class Annotation {
  set index(value: number) {
    this._index = value;
  }

  set source(value: String) {
    this._source = value;
  }

  set sourceLabel(value: String) {
    this._sourceLabel = value;
  }

  set property(value: String) {
    this._property = value;
  }

  set propertyLabel(value: String) {
    this._propertyLabel = value;
  }

  set columnType(value: String) {
    this._columnType = value;
  }

  set columnTypeLabel(value: String) {
    this._columnTypeLabel = value;
  }

  set isSubject(value: Boolean) {
    this._isSubject = value;
  }

  set header(value: String) {
    this._header = value;
  }

  set colName(value: String) {
    this._colName = value;
  }

  set columnDataType(value: String) {
    this._columnDataType = value;
  }

  // get index(): number {
  //   return this._index;
  // }

  get source(): String {
    return this._source;
  }

  get sourceLabel(): String {
    return this._sourceLabel;
  }

  get property(): String {
    return this._property;
  }

  get propertyLabel(): String {
    return this._propertyLabel;
  }

  get columnType(): String {
    return this._columnType;
  }

  get columnTypeLabel(): String {
    return this._columnTypeLabel;
  }

  get isSubject(): Boolean {
    return this._isSubject;
  }

  get header(): String {
    return this._header;
  }

  get colName(): String {
    return this._colName;
  }

  get columnDataType(): String {
    return this._columnDataType;
  }

  private _index: number;
  private _source: String;
  private _sourceLabel: String;
  private _property: String;
  private _propertyLabel: String;
  private _columnType: String;
  private _columnTypeLabel: String;
  private _columnDataType: String;
  private _isSubject: Boolean;
  private _header: String;
  private _colName: String;

  constructor(obj?: any) {
    this._index = obj != null && obj.index != null ? obj.index : -1;
    this._source = obj && obj.source || '';
    this._sourceLabel = obj && obj.sourceLabel || '';
    this._property = obj && obj.property || '';
    this._propertyLabel = obj && obj.propertyLabel || '';
    this._columnType = obj && obj.columnType || '';
    this._columnTypeLabel = obj && obj.columnTypeLabel || '';
    this._isSubject = false;
    this._header = obj && obj.header || '';
    this._colName = obj && obj.colName || '';
    this._columnDataType = obj && obj._columnDataType || '';
  }
}

// here I create the service that has an Array of Annotations.
@Injectable()
export class AnnotationService {

  private annotations;

  public colContent;
  public header;
  public colNum;
  public data;
  public colNames: string[];

  public isFull = false;

  public suggestion;

  public subjects = new Map<number, String>();
  subjectsChange: Subject<Map<number, String>> = new Subject<Map<number, String>>();

  constructor(public http: Http) {
    this.subjectsChange.subscribe((value) => {
      this.subjects = value;
    });
  };

  updateSubjects(subjects) {
    this.subjectsChange.next(subjects);
  }

  init() {
    this.annotations = [];
    console.log('INIZIALIZZATO');
    console.log(this.subjects);
    this.colNames = [];
  }

  // call the remote service that try to annotate the table, after that map the results in the arrays into annotationService
  getRemoteResponse() {
    this.http.request('http://localhost:3000/response').subscribe((res: Response) => {
      const response = res.json();
      // get annotation from remote service
      // first get annotation of named entity columns
      // after get annotation of literal columns
      // in the end (it doesn't even matter) sort annotation through the id
      this.annotations = response.neCols.map((obj: Object) => {
        return new Annotation(obj);
      });
      const b = response.litCols.map((obj: Object) => {
        return new Annotation(obj);
      });

      this.annotations = this.annotations.concat(b);
      this.annotations.sort(function (a, c) {
        if (a.index < c.index) { return -1; }
        if (a.index > c.index) { return 1; }
        return 0;
      });
    },
      (err: any) => {
        console.log(err);
      });
    this.isFull = true;
  }

  setAnnotation(colId, annotation: Annotation) {
    this.subjects.set(colId, annotation.source);
    this.updateSubjects(this.subjects);
    this.annotations[colId] = annotation;
  }

  getAnnotation(colId): Annotation {
    return this.annotations[colId];
  }

  // getHeader() {
  //   return this.header;
  // }

  abstatAutofill(word, position, rows, start): Observable<string[]> {

    const URL = 'http://abstat.disco.unimib.it/api/v1/SolrSuggestions?query='.concat(word, ',',
      position, '&rows=', rows, '&start=', start);

    return this.http.request(URL)
      .map((response: Response) => {
        return (<any>response)._body;
      });
  }

  // AbstatDomain(type, property, object) {
  // }

  generateColumnsName(headers) {
    for (let i = 0; i < headers.length; i++) {
      this.colNames[i] = ''.concat(i.toString(), ': ', headers[i]);
    }
    console.log('GENERATI i colNames');
  }

  // updateSubjects(oldSubject, newSubject) {
  //   const index = this.subjects[0].indexOf(oldSubject);
  //   this.subjects[0].splice(index, 1);
  //   this.subjects[0].push(newSubject);
  //   console.log('ARRAY AGGIORNATO');
  //   console.log(this.subjects[0]);
  // }
}