import { Component, OnInit, OnDestroy } from '@angular/core';
import { AnnotationService } from './annotation.service';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/switch';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/fromEvent';
import { TransformationService } from '../transformation.service';
import { DispatchService } from '../dispatch.service';
import { ActivatedRoute } from '@angular/router';
import { Http } from '@angular/http';
import {Annotation} from './annotation.model';
import * as transformationDataModel from 'assets/transformationdatamodel.js';
import {ColumnTypes, XSDDatatypes} from './annotation-form/annotation-form.component';
import * as generateClojure from 'assets/generateclojure.js';

@Component({
  selector: 'app-tabular-annotation',
  templateUrl: './tabular-annotation.component.html',
  styleUrls: ['./tabular-annotation.component.css'],
})

export class TabularAnnotationComponent implements OnInit, OnDestroy {

  // Local objects/ working memory initialized oninit - removed ondestroy, content transferred to observable ondestroy
  private transformationObj: any;
  private graftwerkData: any;

  saveLoading = false;
  persistLoading = false;
  graphNotSaved = true;

  /**
   * Return the namespace of a URL
   * @param {URL} url
   * @returns {string} the namespace for the given URL
   */
  static getNamespaceFromURL(url: URL) {
    let suffix = '';
    if (url.hash.length > 0) {
      suffix = url.hash.substring(1); // remove '#' char
    } else {
      suffix = url.pathname.substring(url.pathname.lastIndexOf('/') + 1);
    }
    return url.href.substring(0, url.href.indexOf(suffix));
  }

  constructor(public dispatch: DispatchService, public transformationSvc: TransformationService,
    public annotationService: AnnotationService, private route: ActivatedRoute,
    public http: Http) { }

  ngOnInit() {
    this.transformationSvc.currentTransformationObj.subscribe(message => this.transformationObj = message);
    this.transformationSvc.currentGraftwerkData.subscribe(message => this.graftwerkData = message);
    this.retrieveData();
  }

  ngOnDestroy() {
    this.transformationSvc.changeTransformationObj(this.transformationObj);
    this.transformationSvc.changeGraftwerkData(this.graftwerkData);
  }

  retrieveData() {
    if (this.graftwerkData) {
      this.annotationService.headers = this.graftwerkData[':column-names'];
      this.annotationService.data = this.graftwerkData[':rows'];
    } else {
      console.log('graftwerk data not initialized yet')
    }
  }

  /**
   * Create a valid graph using all annotations and save it into the transformation object.
   */
  saveAnnotation() {
    this.saveLoading = true;
    let annotations = this.annotationService.getValidAnnotations();

    /**
     * Create prefixes and namespaces for all properties, types and datatypes.
     * Insert also new prefixes and namespaces into the RDFvocabs array
     */
    annotations = this.updatePrefixesNamespaces(annotations);

    // Create a new instance of graph
    const graph = this.buildGraph(annotations);

    if (this.transformationObj.graphs.length > 0) { // overwrite first graph - TODO: check it
      this.transformationObj.graphs[0] = graph;
    } else {
      this.transformationObj.graphs.push(graph);
    }

    // Save the new transformation
    this.transformationSvc.changeTransformationObj(this.transformationObj);
    this.graphNotSaved = false;
    this.saveLoading = false;
  }

  // Update transformation on DataGraft
  persistTransformation(rdfFormat: string = 'nt') {
    this.persistLoading = true;
    console.log(this.transformationObj);
    const paramMap = this.route.snapshot.paramMap;
    if (paramMap.has('filestoreId') && paramMap.has('transformationId') && paramMap.has('publisher')) {
      const publisher = paramMap.get('publisher');

      const existingTransformationID = paramMap.get('transformationId');
      const someClojure = generateClojure.fromTransformation(transformationDataModel.Transformation.revive(this.transformationObj));
      const newTransformationName = 'test-graft-transformation';
      const isPublic = false;
      const newTransformationDescription = 'testing graft created from annotations';
      const newTransformationKeywords = ['graft', 'annotations'];
      const newTransformationConfiguration = {
        type: 'graft',
        command: 'my-graft',
        code: someClojure,
        json: JSON.stringify(this.transformationObj)
      };
      const filestoreID = paramMap.get('filestoreId');

      return this.dispatch.updateTransformation(existingTransformationID,
        publisher,
        newTransformationName + '-new',
        isPublic,
        newTransformationDescription + ' new',
        newTransformationKeywords.concat('four'),
        newTransformationConfiguration).then(
        (result) => {
          this.transformationSvc.transformFile(filestoreID, existingTransformationID, 'graft', rdfFormat).then(
            (transformed) => {
              console.log(transformed);
              this.persistLoading = false;
            },
            (error) => {
              console.log('Error transforming file');
              console.log(error);
              this.persistLoading = false;
            }
          );
        },
        (error) => {
          console.log('Error updating transformation');
          console.log(error);
          this.persistLoading = false;
        });
    }
    this.persistLoading = false;
  }

  /**
   * Returns a set of annotations where each annotation has prefix and namespace set.
   * @param {Annotation[]} annotations
   * @returns {Annotation[]}
   */
  updatePrefixesNamespaces(annotations: Annotation[]) {
    annotations.forEach((annotation) => {
      // reset all prefixes (useful when the user deletes for instnce the "property" field)
      annotation.urifyPrefix = '';
      annotation.columnTypeNamespace = '';
      annotation.columnTypePrefix = '';
      annotation.columnDatatypeNamespace = '';
      annotation.columnDatatypePrefix = '';

      if (annotation.urifyNamespace !== '') {
        annotation.urifyPrefix = this.getPrefixForNamespace(annotation.urifyNamespace);
      }

      if (annotation.columnType !== '') {
        annotation.columnTypeNamespace = TabularAnnotationComponent.getNamespaceFromURL(new URL(annotation.columnType));
        annotation.columnTypePrefix = this.getPrefixForNamespace(annotation.columnTypeNamespace);
      }

      if (annotation.columnDatatype !== '') {
        annotation.columnDatatypeNamespace = TabularAnnotationComponent.getNamespaceFromURL(new URL(annotation.columnDatatype));
        annotation.columnDatatypePrefix = this.getPrefixForNamespace(annotation.columnDatatypeNamespace);
      }

      if (annotation.property !== '') {
        annotation.propertyNamespace = TabularAnnotationComponent.getNamespaceFromURL(new URL(annotation.property));
        annotation.propertyPrefix = this.getPrefixForNamespace(annotation.propertyNamespace);
      }
    });
    return annotations;
  }

  /**
   * Return a new Graph, identified by its URI
   * @param {Annotation[]} annotations
   * @param {string} graphURI
   * @returns {transformationDataModel.Graph}
   */
  buildGraph(annotations: Annotation[], graphURI = 'http://eubusinessgraph.eu/#/') {
    const objNodes = {};
    const rootNodes = {};

    // Build all object nodes
    // NOTE: the subelements array should be always empty (otherwise, a BLANK NODE will be produced)
    annotations.forEach(annotation => {
      // TODO: to be removed when the header will be cleaned before fetching data
      let cleanHeader = annotation.columnHeader;
      if (cleanHeader.startsWith(':')) {
        cleanHeader = cleanHeader.substring(1);
      }

      if (annotation.columnValuesType === ColumnTypes.URI) {
        // const type = annotation.columnType.substring(annotation.columnTypeNamespace.length);
        // const typeNode = new transformationDataModel.ConstantURI(annotation.columnTypePrefix, type, [], []);
        // const propertyType  = new transformationDataModel.Property('rdf', 'type', [], [typeNode]);

        objNodes[annotation.columnHeader] = new transformationDataModel.ColumnURI(
          {'id': 0, 'value': annotation.urifyPrefix},
          {'id': 0, 'value': cleanHeader},
          [], // node conditions
          [], // subelements
        );
      } else if (annotation.columnValuesType === ColumnTypes.Literal) {
        objNodes[annotation.columnHeader] = new transformationDataModel.ColumnLiteral(
          {'id': 0, 'value': cleanHeader},
          {'id': 0, 'name': Object.keys(XSDDatatypes).find(key => XSDDatatypes[key] === annotation.columnDatatype)}, // datatype
          null, // on empty
          null, // on error
          annotation.langTag,
          annotation.columnDatatype,
          [], // nodeCondition
        );
      }
    });

    // Build all roots nodes
    // NOTE: all URI columns are roots, because of their 'rdf:type' property

    // const subjectCols = Array.from(new Set(this.annotationService.subjects.values()));
    // const subjectAnnotations = annotations.filter(annotation => (subjectCols.includes(annotation.columnHeader)));
    annotations.forEach((annotation) => {
      // TODO: to be removed when the header will be cleaned before fetching data
      let cleanHeader = annotation.columnHeader;
      if (cleanHeader.startsWith(':')) {
        cleanHeader = cleanHeader.substring(1);
      }
      if (annotation.columnValuesType === ColumnTypes.URI) {
        rootNodes[annotation.columnHeader] = new transformationDataModel.ColumnURI(
          {'id': 0, 'value': annotation.urifyPrefix},
          {'id': 0, 'value': cleanHeader},
          [], // node conditions
          this.buildPropertiesForURINode(annotation, objNodes, annotations), // subelements
        )
      }
    });

    // Create a new graph
    const rootsList = [];
    Object.keys(rootNodes).forEach(key => rootsList.push(rootNodes[key]));
    return new transformationDataModel.Graph(graphURI, rootsList)
  }

  /**
   * Given a column of type URI, this method returns all its subelements (which are properties linked to their own objects column) if any.
   * The rdf:type properties is also created.
   * @param {Annotation} annotation
   * @param {{}} objNodes
   * @param {Annotation[]} annotations
   * @returns {Array}
   */
  private buildPropertiesForURINode(annotation: Annotation, objNodes: {}, annotations: Annotation[]) {
    const properties = [];
    const objects = annotations.filter(ann => (ann.subject === annotation.columnHeader));

    // If the annotation is not related to a subject column, this FOR statement will be skipped
    objects.forEach(object => {
      const objectNode = objNodes[object.columnHeader];
      const property = object.property.substring(object.propertyNamespace.length);
      const propertyType = new transformationDataModel.Property(object.propertyPrefix, property, [], [objectNode]);
      properties.push(propertyType)
    });

    // Create the rdf:type prop - all URI annotations must provide their own rdf type
    const typePrefix = annotation.columnTypePrefix;
    const type = annotation.columnType.substring(annotation.columnTypeNamespace.length);
    const typeNode = new transformationDataModel.ConstantURI(typePrefix, type, [], []);
    properties.push(new transformationDataModel.Property('rdf', 'type', [], [typeNode]));
    return properties;
  }

  /**
   * Help method that returns the prefix of a known namespace.
   * @param {string} namespace
   * @returns {any} the prefix if the given namespace is known, null otherwise
   */
  private getExistingPrefixFromNamespace(namespace: string) {
    const existingNS = this.transformationObj.rdfVocabs.filter(vocab => (vocab.namespace === namespace));
    if (existingNS.length > 0) {
      return existingNS[0].name;
    }
    return null;
  }

  /**
   * Check if a vocab with the given prefix does not exist.
   * @param {string} prefix
   * @returns {boolean} true if the given prefix is not already used in a vocab, false otherwise
   */
  private isPrefixValid(prefix: string) {
    const existingPrefix = this.transformationObj.rdfVocabs.filter(vocab => (vocab.name === prefix));
    return existingPrefix.length === 0;
  }

  /**
   * Given a namespace, this method return a valid prefix. The prefix is kept from the rdfVocab
   * if the namespace is known; alternatively, a new prefix is generated and inserted into the
   * rdfVocab array.
   * @param {string} namespace
   * @returns {string} a valid prefix
   */
  getPrefixForNamespace(namespace: string) {
    const existingPrefix = this.getExistingPrefixFromNamespace(namespace);
    let prefix = '';
    if (existingPrefix) {
      prefix = existingPrefix;
    } else {
      const url = new URL(namespace);
      // first 2 letter of the URL domain
      prefix = url.host.replace('www.', '')
        .split('.')[0]
        .substr(0, 2);
      // first 2 letter of the URL pathname
      prefix += url.pathname.split('/')[1]
        .substr(0, 2);
      prefix = prefix.toLowerCase();
      let i = 1;
      while (!this.isPrefixValid(prefix)) {
        prefix = prefix += i;
        ++i;
      }
      // TODO: create a new RDFVocabulary instance
      this.transformationObj.rdfVocabs.push({name: prefix, namespace: namespace, fromServer: false})
    }
    return prefix;
  }
}
