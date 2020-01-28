import { Injectable } from '@angular/core';
import { Annotation, AnnotationStatuses, ColumnTypes } from './annotation.model';
import * as transformationDataModel from 'assets/transformationdatamodel.js';

@Injectable()
export class AnnotationService {

  private urifyDefault = '';
  public headers: string[] = [];

  constructor() {
  }

  setUrifyDefault(urifyDefault: string) {
    this.urifyDefault = urifyDefault;
  }

  getUrifyDefault() {
    return this.urifyDefault;
  }

  /**
   * Given a namespace, this method return a valid prefix. The prefix is kept from the rdfVocab
   * if the namespace is known; alternatively, a new prefix is generated and inserted into the
   * rdfVocab array.
   * @param {string} namespace
   * @returns {string} a valid prefix
   */
  getPrefixForNamespace(namespace: string, transformation: any) {
    let prefix = transformation.getExistingPrefixForURI(namespace);

    if (!prefix) {
      const url = new URL(namespace);
      // first 2 letter of the URL domain
      prefix = url.host.replace('www.', '')
        .split('.')[0]
        .substr(0, 2);
      // first 2 letter of the URL pathname
      prefix += url.pathname.split('/')[1]
        .substr(0, 2);
      // to lowercase and remove all digits (if any - e.g., w3 vocabs
      prefix = prefix.toLowerCase().replace(/\d+/g, '');
      // append a number in case the prefix is not available (already in use)
      let i = 1;
      let tmpPrefix = prefix;
      while (transformation.getURIForPrefix(tmpPrefix)) {
        tmpPrefix = prefix + i;
        ++i;
      }
      prefix = tmpPrefix;
      // create a new RDFVocabulary instance
      transformation.rdfVocabs.push(new transformationDataModel.RDFVocabulary(prefix, namespace, [], []));
    }
    return prefix;
  }

  // private getAnnotationStatus(annotation, stopRecursion = false) {
  //   // If I'm not valid, return my status
  //   if (!this.headers.includes(annotation.columnName)) {
  //     return AnnotationStatuses.wrong; // the annotation is related to a column that does not exist
  //   }

  //   if (annotation.isSubject && annotation instanceof transformationDataModel.URINodeAnnotation) {
  //     return AnnotationStatuses.wrong; // a subject column must be of type URI (checked also by form validators)
  //   }
  //   // If I have a subject, my status depends on my subject's status
  //   let parentStatus = null;
  //   if (annotation.subjectAnnotationId && !stopRecursion) {
  //     const parentAnnotation = this.transformationObj.getAnnotationById(annotation.subjectAnnotationId);
  //     if (!parentAnnotation) {
  //       return AnnotationStatuses.warning; // subject is set, but its column is not annotated yet -> potential error
  //     } else {
  //       stopRecursion = parentAnnotation.columnName === annotation.columnName; // I'm the subject of my subject -> avoid infinite loop!
  //       parentStatus = this.getAnnotationStatus(parentAnnotation, stopRecursion);
  //       if (parentStatus !== AnnotationStatuses.valid) {
  //         return AnnotationStatuses.warning; // if my subject is wrong or warning, I'm warning
  //       }
  //     }
  //   }
  //   // If I have not a subject or if my subject is valid, I'm valid
  //   return AnnotationStatuses.valid;
  // }
}
