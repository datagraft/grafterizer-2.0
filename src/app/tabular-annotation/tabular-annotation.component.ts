import { Component, OnInit, OnDestroy } from '@angular/core';
import {AnnotationService} from './annotation.service';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/switch';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/fromEvent';
import { TransformationService } from '../transformation.service';
import { DispatchService } from '../dispatch.service';
import { ActivatedRoute } from '@angular/router';
import { RoutingService } from '../routing.service';
import { Http } from '@angular/http';
import {Annotation, AnnotationStatuses, ColumnTypes, XSDDatatypes} from './annotation.model';
import * as transformationDataModel from 'assets/transformationdatamodel.js';
import { AnnotationFormComponent } from './annotation-form/annotation-form.component';
import * as generateClojure from 'assets/generateclojure.js';
import { MatDialog } from '@angular/material';
import {ConfigComponent} from './config/config.component';

declare var Handsontable: any;

@Component({
  selector: 'app-tabular-annotation',
  templateUrl: './tabular-annotation.component.html',
  styleUrls: ['./tabular-annotation.component.css'],
})
export class TabularAnnotationComponent implements OnInit, OnDestroy {

  // Local objects/ working memory initialized oninit - removed ondestroy, content transferred to observable ondestroy
  private transformationObj: any;
  private graftwerkData: any;

  private container: any;
  private settings: any;
  public hot: any;

  public saveLoading: boolean;
  public retrieveRDFLoading: boolean;
  public dataLoading: boolean;

  public saveButtonDisabled: boolean;
  public rdfButtonDisabled: boolean;

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
    public annotationService: AnnotationService, private route: ActivatedRoute, private routingService: RoutingService,
    public http: Http, public dialog: MatDialog) {
    route.url.subscribe(() => this.routingService.concatURL(route));
    this.dataLoading = true;
    this.saveLoading = false;
    this.retrieveRDFLoading = false;
    this.saveButtonDisabled = true;
    this.rdfButtonDisabled = true;
  }

  ngOnInit() {
    this.dataLoading = true;
    this.container = document.getElementById('handsontable');
    this.settings = {
      data: [],
      rowHeaders: true,
      colHeaders: [],
      autoColumnSize: true,
      manualColumnResize: true,
      columnSorting: false,
      viewportColumnRenderingOffset: 40,
      height: 660,
      width: 1610,
      wordWrap: true,
      stretchH: 'all',
      className: 'htCenter htMiddle',
      observeDOMVisibility: true,
      preventOverflow: false,
      fillHandle: false,
      readOnly: true,
      observeChanges: true,
    };
    this.hot = new Handsontable(this.container, this.settings);
    this.hot.updateSettings({
      beforeOnCellMouseDown: (event, coords, TD, blockCalculations) => {
        if (event.realTarget.nodeName === 'BUTTON' || (
          event.realTarget.nodeName === 'CLR-ICON' && event.path[1] && event.path[1].nodeName === 'BUTTON')) {
          blockCalculations.cells = true;
          this.openDialogForSelectedColumn(coords.col);
        }
        return ;
      },
      afterLoadData: () => {
        this.hot.render();
      }
    });
    this.transformationSvc.currentTransformationObj.subscribe(message => this.transformationObj = message);
    this.transformationSvc.currentGraftwerkData.subscribe(message => {
      this.dataLoading = true;
      this.graftwerkData = message;
      if (this.graftwerkData[':column-names'] && this.graftwerkData[':column-names']) {
        // Clean header name (remove leading ':' from the EDN response)
        this.annotationService.headers = this.graftwerkData[':column-names'].map((h) => h.substr(1));
        this.annotationService.data = this.graftwerkData[':rows'];
        this.hot.updateSettings({
          columns: this.graftwerkData[':column-names'].map(h => ({data: h})), // don't remove leading ':' here!
          colHeaders: (col) => this.getTableHeader(col)
        });
        this.hot.loadData(this.annotationService.data);
      }
      this.dataLoading = false;
    });
    this.dataLoading = false;
  }

  ngOnDestroy() {
    this.transformationSvc.changeTransformationObj(this.transformationObj);
    this.transformationSvc.changeGraftwerkData(this.graftwerkData);
  }

  openDialogForSelectedColumn(headerIdx): void {
    const currentHeader = this.annotationService.headers[headerIdx];
    const currentAnnotation = this.annotationService.getAnnotation(currentHeader);

    const dialogRef = this.dialog.open(AnnotationFormComponent, {
      width: '700px',
      data: { header: currentHeader, annotation: currentAnnotation, rdfVocabs: this.transformationObj.rdfVocabs}
    });

    dialogRef.afterClosed().subscribe(result => {
      this.hot.updateSettings({
        colHeaders: (col) => this.getTableHeader(col)
      });
      this.saveButtonDisabled = this.annotationService.getValidAnnotations().length === 0;
    });
  }

  openConfigDialog(): void {
    const dialogRef = this.dialog.open(ConfigComponent, {
      width: '700px'
    });
  }

  getTableHeader(col): string {
    const header = this.annotationService.headers[col];
    const annotation = this.annotationService.getAnnotation(header);
    const buttonIconShape = annotation ? 'pencil' : 'plus';
    let HTMLHeader = header +
      '<button class="btn btn-sm btn-link btn-icon">' +
      '<clr-icon shape="' + buttonIconShape + '"></clr-icon>' +
      '</button>';
    if (annotation) {
      let statusIcon = '';
      let tooltipContent = '';
      if (annotation.status === AnnotationStatuses.wrong) {
        statusIcon = '<clr-icon shape="error-standard" class="is-danger is-solid"></clr-icon>';
        tooltipContent = 'This column is not correctly annotated';
      } else if (annotation.status === AnnotationStatuses.warning) {
        statusIcon = '<clr-icon shape="warning-standard" class="is-warning is-solid"></clr-icon>';
        tooltipContent = 'This column annotation depends on <i>' + annotation.subject + '</i> column, which is not correctly annotated';
      } else if (annotation.status === AnnotationStatuses.valid) {
        statusIcon = '<clr-icon shape="success-standard" class="is-success is-solid"></clr-icon>';
        tooltipContent = 'This column is properly annotated';
      }
      HTMLHeader += '<label role="tooltip" aria-haspopup="true" class="tooltip tooltip-sm tooltip-bottom-right">' +
        statusIcon +
        '    <span class="tooltip-content">' + tooltipContent + '</span>' +
        '</label>';
      HTMLHeader += '<br>';
      let type = annotation.columnValuesType === ColumnTypes.URI ? annotation.columnTypes.join(',<br>&nbsp;&nbsp;&nbsp;') : annotation.columnDatatype;
      let property = annotation.property;
      let subject = annotation.subject;

      type = '<span style="color: #48960C">' + type + '</span>';
      property = '<span style="color: #5264AE">' + property + '</span>';
      subject = '<span style="color: #737373">' + subject + '</span>';

      if (annotation.subject !== '') {
        HTMLHeader += '<p class="p7" style="text-align: left; margin-top: 0;">' +
          property + '<br>&nbsp;&nbsp;&nbsp; (' + type + ')<br>sourceCol: ' + subject + '</p>';
      } else {
        HTMLHeader += '<p class="p7" style="text-align: left; margin-top: 0;"> (' + type + ')</p>';
      }
    }
    return HTMLHeader;
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

    console.log(annotations);

    // Create a new instance of graph
    const graph = this.buildGraph(annotations);

    if (this.transformationObj.graphs.length > 0) { // overwrite first graph - TODO: check it
      this.transformationObj.graphs[0] = graph;
    } else {
      this.transformationObj.graphs.push(graph);
    }

    console.log(this.transformationObj);

    // Save the new transformation
    this.transformationSvc.changeTransformationObj(this.transformationObj);

    // Persist the Graph to DataGraft
    const paramMap = this.route.snapshot.paramMap;
    if (paramMap.has('transformationId') && paramMap.has('publisher')) {
      const publisher = paramMap.get('publisher');

      const existingTransformationID = paramMap.get('transformationId');
      const someClojure = generateClojure.fromTransformation(transformationDataModel.Transformation.revive(this.transformationObj));
      console.log(someClojure);
      const newTransformationName = 'test-graft-transformation-ocorp';
      const isPublic = false;
      const newTransformationDescription = 'testing graft created from annotations';
      const newTransformationKeywords = ['graft', 'annotations'];
      const newTransformationConfiguration = {
        type: 'graft',
        command: 'my-graft',
        code: someClojure,
        json: JSON.stringify(this.transformationObj)
      };

      return this.dispatch.updateTransformation(existingTransformationID,
        publisher,
        newTransformationName + '-new',
        isPublic,
        newTransformationDescription + ' new',
        newTransformationKeywords.concat('four'),
        newTransformationConfiguration).then(
        (result) => {
          console.log(result);
          console.log('Data uploaded');
          this.rdfButtonDisabled = false;
          this.saveLoading = false;
        },
        (error) => {
          console.log('Error updating transformation');
          console.log(error);
          this.rdfButtonDisabled = true;
          this.saveLoading = false;
        });
    }
    this.saveLoading = false;
  }

  /**
   * Retrieve the RDF triples
   * @param {string} rdfFormat specifies the RDF syntax
   */
  retrieveRDF(rdfFormat: string = 'nt') {
    this.retrieveRDFLoading = true;
    const paramMap = this.route.snapshot.paramMap;
    if (paramMap.has('transformationId') && paramMap.has('filestoreId')) {
      const existingTransformationID = paramMap.get('transformationId');
      const filestoreID = paramMap.get('filestoreId');
      console.log(this.transformationObj);
      this.transformationSvc.transformFile(filestoreID, existingTransformationID, 'graft', rdfFormat).then(
        (transformed) => {
          console.log(transformed);
          this.retrieveRDFLoading = false;
        },
        (error) => {
          console.log('Error transforming file');
          console.log(error);
          this.retrieveRDFLoading = false;
        }
      );
    }
    this.retrieveRDFLoading = false;
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
      annotation.columnTypesNamespace = [];
      annotation.columnTypesPrefix = [];
      annotation.columnDatatypeNamespace = '';
      annotation.columnDatatypePrefix = '';

      if (annotation.urifyNamespace !== '') {
        annotation.urifyPrefix = this.getPrefixForNamespace(annotation.urifyNamespace);
      }

      for (let i = 0; i < annotation.columnTypes.length; ++i) {
        annotation.columnTypesNamespace.push(TabularAnnotationComponent.getNamespaceFromURL(new URL(annotation.columnTypes[i])));
        annotation.columnTypesPrefix.push(this.getPrefixForNamespace(annotation.columnTypesNamespace[i]));
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
    // NOTE: the subelements array of these nodes should be always empty (otherwise, a BLANK NODE will be produced)
    annotations.forEach(annotation => {
      if (annotation.columnValuesType === ColumnTypes.URI) {
        objNodes[annotation.columnHeader] = new transformationDataModel.ColumnURI(
          {'id': 0, 'value': annotation.urifyPrefix},
          {'id': 0, 'value': annotation.columnHeader},
          [], // node conditions
          [], // subelements
        );
      } else if (annotation.columnValuesType === ColumnTypes.Literal) {
        let datatype = Object.keys(XSDDatatypes).find(key => XSDDatatypes[key] === annotation.columnDatatype);
        if (!datatype) {
          datatype = 'custom';
        }
        objNodes[annotation.columnHeader] = new transformationDataModel.ColumnLiteral(
          {'id': 0, 'value': annotation.columnHeader},
          {'id': 0, 'name': datatype}, // datatype
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
    annotations.forEach((annotation) => {
      if (annotation.columnValuesType === ColumnTypes.URI) {
        rootNodes[annotation.columnHeader] = new transformationDataModel.ColumnURI(
          {'id': 0, 'value': annotation.urifyPrefix},
          {'id': 0, 'value': annotation.columnHeader},
          [], // node conditions
          this.buildPropertiesForURINode(annotation, objNodes, annotations), // subelements
        );
      }
    });

    // Create a new graph
    const rootsList = [];
    Object.keys(rootNodes).forEach(key => rootsList.push(rootNodes[key]));
    return new transformationDataModel.Graph(graphURI, rootsList);
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
      properties.push(propertyType);
    });

    // Create the rdf:type prop - all URI annotations must provide their own rdf type
    for (let i = 0; i < annotation.columnTypes.length; ++i) {
      const typePrefix = annotation.columnTypesPrefix[i];
      const type = annotation.columnTypes[i].substring(annotation.columnTypesNamespace[i].length);
      const typeNode = new transformationDataModel.ConstantURI(typePrefix, type, [], []);
      properties.push(new transformationDataModel.Property('rdf', 'type', [], [typeNode]));
    }
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
      console.log(existingPrefix);
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
      this.transformationObj.rdfVocabs.push({name: prefix, namespace: namespace, fromServer: false});
    }
    return prefix;
  }
}
