import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Subject } from 'rxjs/Subject';
import {Annotation} from './annotation.model';

@Injectable()
export class AnnotationService {

  private annotations;
  public headers: string[];
  public data;

  public isFull = false;

  public subjects = new Map<string, string>();
  subjectsChange: Subject<Map<string, string>> = new Subject<Map<string, string>>();

  constructor(public http: Http) {
    this.annotations = {};
    this.headers = [];
    this.data = [];
    this.subjectsChange.subscribe((value) => {
      this.subjects = value;
    });
  };

  updateSubjects(subjects) {
    this.subjectsChange.next(subjects);
  }

  // call the remote service that try to annotate the table, after that map the results in the arrays into annotationService
  getRemoteResponse() {
    // TODO: change url
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
    },
      (err: any) => {
        console.log(err);
      });
    this.isFull = true;
  }

  setAnnotation(columnHeader: string, annotation: Annotation) {
    this.subjects.set(columnHeader, annotation.subject);
    this.updateSubjects(this.subjects);
    this.annotations[columnHeader] = annotation;
  }

  removeAnnotation(columnHeader: string) {
    this.subjects.delete(columnHeader);
    this.updateSubjects(this.subjects);
    delete this.annotations[columnHeader];
  }

  getAnnotation(columnHeader: string): Annotation {
    return this.annotations[columnHeader];
  }

  /**
   * Get all annotations (also those annotations related to deleted columns!)
   * @returns {Annotation[]}
   */
  getAnnotations(): Annotation[] {
    const annotations = [];
    Object.keys(this.annotations).forEach(key => annotations.push(this.annotations[key]));
    return annotations;
  }

  /**
   * Get all annotations that are valid (not related to deleted columns)
   * @returns {Annotation[]}
   */
  getValidAnnotations(): Annotation[] {
    const annotations = [];
    Object.keys(this.annotations).forEach(key => {
      const currentAnnotation = this.annotations[key];
      if (this.headers.indexOf(currentAnnotation.columnHeader) > -1) {
        annotations.push(currentAnnotation);
      }
    });
    return annotations;
  }
}
