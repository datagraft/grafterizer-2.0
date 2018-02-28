import { Injectable } from '@angular/core';
import { Annotation } from './annotation.model';

@Injectable()
export class AnnotationService {

  private annotations;
  public headers: string[];
  public data;
  public subjects;

  constructor() {
    this.annotations = {};
    this.headers = [];
    this.data = [];
    this.subjects = new Map<string, string>();
  }

  setAnnotation(columnHeader: string, annotation: Annotation) {
    console.log(annotation);
    console.log(annotation.subject);
    if (annotation.subject !== '') {
      this.subjects.set(columnHeader, annotation.subject);
    }
    console.log(this.subjects);
    this.annotations[columnHeader] = annotation;
    this.updateSubjects();
  }

  removeAnnotation(columnHeader: string) {
    this.subjects.delete(columnHeader);
    delete this.annotations[columnHeader];
    this.updateSubjects();
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

  private updateSubjects() {
    Object.values(this.annotations).forEach((ann) => {
      this.annotations[ann.columnHeader].isSubject = Array.from(this.subjects.values()).includes(ann.columnHeader);
    });
  }
}
