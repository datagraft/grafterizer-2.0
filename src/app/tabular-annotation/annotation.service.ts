import { Injectable } from '@angular/core';
import { Annotation, AnnotationStatuses, ColumnTypes } from './annotation.model';

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
    if (annotation.subject !== '') {
      this.subjects.set(columnHeader, annotation.subject);
    }
    this.annotations[columnHeader] = annotation;
    this.updateSubjects();
    this.updateStatuses();
  }

  removeAnnotation(columnHeader: string) {
    this.subjects.delete(columnHeader);
    delete this.annotations[columnHeader];
    this.updateSubjects();
    this.updateStatuses();
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
   * Get all annotations that are valid (not related to deleted columns or to a subject column that is not annotated)
   * @returns {Annotation[]}
   */
  getValidAnnotations(): Annotation[] {
    const annotations = [];
    Object.keys(this.annotations).forEach(key => {
      const currentAnnotation = this.annotations[key];
      if (currentAnnotation.status === AnnotationStatuses.valid) {
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
  private updateStatuses() {
    Object.values(this.annotations).forEach((ann) => {
      this.annotations[ann.columnHeader].status = this.getAnnotationStatus(ann);
    });
  }

  private getAnnotationStatus(annotation) {
    // If I'm not valid, return my status
    if (!this.headers.includes(annotation.columnHeader)) {
      return AnnotationStatuses.wrong; // the annotation is related to a column that does not exist
    }

    if (annotation.isSubject && annotation.columnValuesType !== ColumnTypes.URI) {
      return AnnotationStatuses.wrong; // a subject column must be of type URI (checked also by form validators)
    }
    // If I have a subject, my status depends on my subject's status
    let parentStatus = null;
    if (annotation.subject !== '') {
      const parentAnnotation = this.annotations[annotation.subject];
      if (!parentAnnotation) {
        return AnnotationStatuses.warning; // subject is set, but its column is not annotated yet -> potential error
      } else {
        parentStatus = this.getAnnotationStatus(parentAnnotation);
        if (parentStatus !== AnnotationStatuses.valid) {
          return AnnotationStatuses.warning; // if my subject is wrong or warning, I'm warning
        }
      }
    }
    // If I have not a subject, I'm valid
    return AnnotationStatuses.valid;
  }
}
