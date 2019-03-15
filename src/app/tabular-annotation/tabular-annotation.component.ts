import {Component, OnDestroy, OnInit} from '@angular/core';
import {AnnotationService} from './annotation.service';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/switch';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/fromEvent';
import {TransformationService} from '../transformation.service';
import {DispatchService} from '../dispatch.service';
import {ActivatedRoute} from '@angular/router';
import {RoutingService} from '../routing.service';
import {Annotation, AnnotationStatuses, ColumnTypes, XSDDatatypes} from './annotation.model';
import * as transformationDataModel from 'assets/transformationdatamodel.js';
import {AnnotationFormComponent} from './annotation-form/annotation-form.component';
import {MatDialog} from '@angular/material';
import {ConfigComponent} from './config/config.component';
import {Subscription} from 'rxjs';
import {EnrichmentService} from './enrichment/enrichment.service';
import {ConciliatorService, DeriveMap, ReconciledColumn, Type} from './enrichment/enrichment.model';
import {PipelineEventsService} from '../tabular-transformation/pipeline-events.service';
import {ReconciliationComponent} from './enrichment/reconciliation/reconciliation.component';
import {ExtensionComponent} from './enrichment/extension/extension.component';
import {ShiftColumnFunction} from 'assets/transformationdatamodel';
import {ChooseExtensionOrReconciliationDialog} from './chooseExtensionOrReconciliationDialog.component';

declare var Handsontable: any;

@Component({
  selector: 'app-tabular-annotation',
  templateUrl: './tabular-annotation.component.html',
  styleUrls: ['./tabular-annotation.component.css'],
})
export class TabularAnnotationComponent implements OnInit, OnDestroy {

  public geoNamesSources: string [];
  public categoriesSources: string [];

  private transformationObj: any;
  private graftwerkData: any;

  private transformationSubscription: Subscription;
  private previewedTransformationSubscription: Subscription;
  private dataSubscription: Subscription;

  private container: any;
  private settings: any;
  public hot: any;

  public saveLoading: boolean;
  public retrieveRDFLoading: boolean;
  public dataLoading: boolean;
  public formChoose = 0;

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
              public annotationService: AnnotationService, public enrichmentService: EnrichmentService,
              private route: ActivatedRoute, private routingService: RoutingService, public dialog: MatDialog,
              private pipelineEventsSvc: PipelineEventsService) {
    route.url.subscribe(() => this.routingService.concatURL(route));
    this.saveLoading = false;
    this.retrieveRDFLoading = false;
    this.saveButtonDisabled = this.annotationService.getAnnotations().length === 0;
    this.rdfButtonDisabled = true;

  }

  ngOnInit() {
    this.container = document.getElementById('handsontable');
    this.settings = {
      data: [],
      rowHeaders: true,
      colHeaders: [],
      autoColumnSize: true,
      manualColumnResize: true,
      columnSorting: false,
      viewportColumnRenderingOffset: 40,
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
        if (event.target.parentNode.id.startsWith('annotation_') || event.realTarget.id.startsWith('annotation_')) {
          console.log('annotation');
          blockCalculations.cells = true;
          this.openAnnotationDialog(coords.col);
        } else if (event.target.parentNode.id.startsWith('enrich_') || event.realTarget.id.startsWith('enrich_')) {
          console.log('enrichment');
          blockCalculations.cells = true;
          this.openEnrichmentDialog(coords.col);
        }
        return;
      },
      afterLoadData: () => {
        this.hot.render();
        this.dataLoading = false;
      },
    });

    this.transformationSubscription =
      this.transformationSvc.currentTransformationObj.subscribe((transformationObj) => {
        this.transformationObj = transformationObj;
      });
    this.previewedTransformationSubscription = this.transformationSvc.currentPreviewedTransformationObj
      .subscribe((previewedTransformation) => {
        this.dataLoading = true;
      });
    this.dataSubscription = this.transformationSvc.currentGraftwerkData.subscribe((graftwerkData) => {
      this.graftwerkData = graftwerkData;
      if (this.graftwerkData[':column-names'] && this.graftwerkData[':rows']) {
        // Clean header name (remove leading ':' from the EDN response)
        this.annotationService.headers = this.graftwerkData[':column-names'].map((h) => h.substr(1));
        this.annotationService.data = this.graftwerkData[':rows'];

        this.enrichmentService.headers = this.graftwerkData[':column-names'].map((h) => h.substr(1));
        this.enrichmentService.data = this.graftwerkData[':rows'];

        if (this.transformationObj['annotations']) {
          this.transformationObj['annotations'].forEach(annotationObj => {
            const annotation = new Annotation(annotationObj);
            this.annotationService.setAnnotation(annotation.columnHeader, annotation);
          });
          this.saveButtonDisabled = this.annotationService.getAnnotations().length === 0;
        }

        if (this.transformationObj['reconciledColumns']) {
          this.transformationObj['reconciledColumns'].forEach((recColObj) => {
            const reconciledCol = new ReconciledColumn(recColObj._deriveMap, recColObj._conciliator);

            // Check if the user has removed manually the reconciliation step from the pipeline
            if (this.transformationObj.pipelines[0].functions
              .filter(f => f.name === 'derive-column' && f.newColName === reconciledCol.getHeader())
              .length > 0) {
              this.enrichmentService.setReconciledColumn(reconciledCol);
            }
          });
        }

        this.transformationObj.setAnnotations(this.annotationService.getAnnotations()); // save also warning and wrong annotations!
        this.transformationObj.setReconciledColumns(this.enrichmentService.getReconciledColumns());
        this.transformationSvc.changeTransformationObj(this.transformationObj);

        this.hot.updateSettings({
          columns: this.getTableColumns(),
          colHeaders: (col) => this.getTableHeader(col)
        });
        this.hot.loadData(this.annotationService.data);
      }
    });

  }

  ngOnDestroy() {
    this.transformationSubscription.unsubscribe();
    this.dataSubscription.unsubscribe();
    this.previewedTransformationSubscription.unsubscribe();
  }

  openAnnotationDialog(headerIdx): void {
    const currentHeader = this.annotationService.headers[headerIdx];
    const currentAnnotation = this.annotationService.getAnnotation(currentHeader);

    const dialogRef = this.dialog.open(AnnotationFormComponent, {
      width: '750px',
      data: {header: currentHeader, annotation: currentAnnotation, rdfVocabs: this.transformationObj.rdfVocabs}
    });

    dialogRef.afterClosed().subscribe(result => {
      this.hot.updateSettings({
        columns: this.getTableColumns(),
        colHeaders: (col) => this.getTableHeader(col)
      });
      this.saveButtonDisabled = this.annotationService.getAnnotations().length === 0;
    });
  }

  openConfigDialog(): void {
    const dialogRef = this.dialog.open(ConfigComponent, {
      width: '600px'
    });
  }

  openEnrichmentDialog(headerIdx): void {
    const currentHeader = this.annotationService.headers[headerIdx];
    const annotation = this.annotationService.getAnnotation(currentHeader);
    const isReconciled = this.enrichmentService.isColumnReconciled(currentHeader);
    const isDateColumn = this.enrichmentService.isColumnDate(currentHeader);

    this.geoNamesSources = [];
    this.categoriesSources = [];
    this.annotationService.headers.forEach((header: string) => {
      if (this.enrichmentService.isColumnReconciled(header)) {
        if (this.enrichmentService.getReconciliationServiceOfColumn(header).getId() === 'geonames') {
          this.geoNamesSources.push(header);
        } else if (this.enrichmentService.getReconciliationServiceOfColumn(header).getId() === 'productsservices') {
          this.categoriesSources.push(header);
        }
      }
      /*
      const annotation =this.annotationService.getAnnotation(geo);
        if (annotation)
        {
          if (annotation.columnValuesType === ColumnTypes.URI)
          {
            for (let i = 0; i < annotation.columnTypes.length; ++i)
            {
              const type = annotation.columnTypes[i];
              if(type.search("geonames.org") !== -1 ) //http://sws.geonames.org/
              {
                this.geoNamesSources.push(geo);
              }
            }//end for
          }// end uri
        }//end if annotation*/
    });

    let dialogRef;
    const dialogConfig = {
      width: '750px',
      data: { header: currentHeader, indexCol: headerIdx, colReconciled: isReconciled, colDate: false }
    };
    const dialogConfigExtension = {
      width: '750px',
      data: {
        header: currentHeader,
        indexCol: headerIdx,
        colReconciled: isReconciled,
        colDate: false,
        geoSoources: this.geoNamesSources,
        categoriesSoources: this.categoriesSources
      }
    };
    const dialogConfigDateCOlumn = {
      width: '750px',
      data: {
        header: currentHeader,
        indexCol: headerIdx,
        colReconciled: isReconciled,
        colDate: true,
        geoSoources: this.geoNamesSources,
        categoriesSoources: this.categoriesSources
      }
    };
    const dialogConfigReconciliation = {
      width: '800px',
      data: {header: currentHeader, indexCol: headerIdx, colReconciled: isReconciled, colDate: false}
    };
    /*const dialogConfigChoose = {
      width: '400px',
      disableClose: true,
      data: {indexCol : headerIdx}
    };*/

    if (isReconciled) {
      if (annotation) { // to check if it's a dateCOlumn
        if (annotation.columnValuesType === ColumnTypes.URI) {
          dialogRef = this.dialog.open(ExtensionComponent, dialogConfigExtension);
        } else {

          const type = annotation.columnDatatype;
          const shortType = type.substr(TabularAnnotationComponent.getNamespaceFromURL(new URL(type)).length);
          if (shortType === 'dateTime') { // it's a dateColumn --> open dialogConfigDateCOlumn
            dialogRef = this.dialog.open(ExtensionComponent, dialogConfigDateCOlumn);
          } else {
            dialogRef = this.dialog.open(ExtensionComponent, dialogConfigExtension);
          }
        }

      } else {
        dialogRef = this.dialog.open(ExtensionComponent, dialogConfigExtension);
      }

    } else if (annotation) {
      if (annotation.columnValuesType === ColumnTypes.URI) {
        // to do
        dialogRef = this.dialog.open(ReconciliationComponent, dialogConfigReconciliation);

      } else {

        const type = annotation.columnDatatype;
        const shortType = type.substr(TabularAnnotationComponent.getNamespaceFromURL(new URL(type)).length);
        if (shortType === 'dateTime') {// it's a dateColumn --> open dialogConfigDateCOlumn
          dialogRef = this.dialog.open(ExtensionComponent, dialogConfigDateCOlumn);
        } else {// it's not a dateColumn --> open a normal ReconciliationComponent
          dialogRef = this.dialog.open(ReconciliationComponent, dialogConfigReconciliation);
        }
      }

    } else { // it's not reconcled and not annotated column so --> open ReconciliationComponent
      dialogRef = this.dialog.open(ReconciliationComponent, dialogConfigReconciliation);
    }

    dialogRef.afterClosed().subscribe(result => {

      /*  if (result && result['chosen']){//open reconciliation form

          this.formChoose = result['chosen'];
          this.openEnrichmentDialog(headerIdx);
          this.formChoose = 0;

        }
        else */
      if (result && result['deriveMaps']) {
        this.deriveColumnsFromEnrichment(result['indexCol'], result['header'], result['deriveMaps'], result['conciliator'], result['shift']);

      }
      // Update headers (some columns might have been annotated)
      this.hot.updateSettings({
        columns: this.getTableColumns(),
        colHeaders: (col) => this.getTableHeader(col)
      });
    });

  }

  getTableColumns() {
    return this.graftwerkData[':column-names'].map(h => {
      const ann = this.annotationService.getAnnotation(h.substr(1));
      if (ann && ann.columnValuesType === ColumnTypes.URI) {
        return ({
          data: h, // don't remove leading ':' from header here!
          renderer: (instance, td, row, col, prop, value, cellProperties) => {
            const annotation = this.annotationService.getAnnotation(this.annotationService.headers[col]);
            td.className = 'htCenter htMiddle htDimmed';
            if (value) {
              td.innerHTML = `<a href="${annotation.urifyNamespace}${value}" target="_blank">${value}</a>`;
            } else {
              td.innerHTML = '';
            }
            return td;
          }
        });
      } else {
        return {data: h}; // don't remove leading ':' from header here!
      }
    });
  }

  /**
   * Return the HTML template as string for the given column
   * @param col
   * @returns {string}
   */
  getTableHeader(col): string {
    const header = this.annotationService.headers[col];
    const annotation = this.annotationService.getAnnotation(header);
    const buttonIconShape = annotation ? 'edit' : 'add';
    let HTMLHeader = header +
      '<button class="btn btn-sm btn-link btn-icon" id="annotation_ ' + col + '">' +
      '<i class="material-icons" >' + buttonIconShape + ' </i>' +
      '</button>';
    if (annotation) {
      // STATUS ICON
      let statusIcon = '';
      let tooltipContent = '';
      if (annotation.status === AnnotationStatuses.wrong) {
        statusIcon = '<i class="material-icons" style="color:red	;">error</i>';
        tooltipContent = 'This column is not correctly annotated';
      } else if (annotation.status === AnnotationStatuses.warning) {
        statusIcon = '<i class="material-icons" style="color:Gold	;">warning</i>';
        tooltipContent = 'This column annotation depends on <i>' + annotation.subject + '</i> column, which is not correctly annotated';
      } else if (annotation.status === AnnotationStatuses.valid) {
        statusIcon = '<i class="material-icons" style="color:green;">check_circle</i>';
        tooltipContent = 'This column is properly annotated';
      }
      HTMLHeader += '<label role="tooltip" aria-haspopup="true" class="tooltip tooltip-sm tooltip-bottom-right">' +
        '<button class="btn btn-sm btn-link btn-icon">' +
        statusIcon +
        '</button>' +
        '    <span class="tooltip-content">' + tooltipContent + '</span>' +
        '</label>';
    }

    // ENRICHMENT BUTTON
    HTMLHeader += '<button class="btn btn-sm btn-link btn-icon" id="enrich_ ' + col + '">' +
      '<i class="material-icons top-margin" > view_column </i>' +
      '</button>';

    if (annotation) {
      HTMLHeader += '<br>';

      // ANNOTATION DETAILS
      let annInfoLabel: string;
      let annInfoTypes: string;
      let annInfoValues: string;

      // TYPES
      if (annotation.columnValuesType === ColumnTypes.URI) {
        annInfoLabel = '<p class="p7 ann-info-label">Type(s):</p>';
        annInfoTypes = '';
        for (let i = 0; i < annotation.columnTypes.length; ++i) {
          const type = annotation.columnTypes[i];
          const shortType = type.substr(TabularAnnotationComponent.getNamespaceFromURL(new URL(type)).length);
          annInfoTypes += '<span class="p7 ann-info-types" title="' + type + '">' + shortType + '</span>';
        }
      } else {
        annInfoLabel = '<p class="p7 ann-info-label">Datatype:</p>';
        const type = annotation.columnDatatype;
        const shortType = type.substr(TabularAnnotationComponent.getNamespaceFromURL(new URL(type)).length);

        annInfoTypes = '<span class="p7 ann-info-types" title="' + type + '">' + shortType + '</span>';
      }
      annInfoValues = '<div class="ann-info-values">' + annInfoTypes + '</div>';
      HTMLHeader += '<div class="header-ann-info">' + annInfoLabel + annInfoValues + '</div>';

      if (annotation.subject !== '') {
        // PROPERTY
        annInfoLabel = '<p class="p7 ann-info-label">Prop:</p>';
        const prop = annotation.property;
        const shortProp = prop.substr(TabularAnnotationComponent.getNamespaceFromURL(new URL(prop)).length);
        const annInfoProp = '<span class="p7 ann-info-prop" title="' + prop + '">' + shortProp + '</span>';
        annInfoValues = '<div class="ann-info-values">' + annInfoProp + '</div>';
        HTMLHeader += '<div class="header-ann-info">' + annInfoLabel + annInfoValues + '</div>';

        // SOURCE
        annInfoLabel = '<p class="p7 ann-info-label">SourceCol:</p>';
        const source = annotation.subject;
        const annInfoSource = '<span class="p7 ann-info-source">' + source + '</span>';
        annInfoValues = '<div class="ann-info-values">' + annInfoSource + '</div>';
        HTMLHeader += '<div class="header-ann-info">' + annInfoLabel + annInfoValues + '</div>';
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

    // Create a new instance of graph
    const graph = this.buildGraph(annotations);
    // if empty graph array --> push new rdf-tree-mapping graph(index 0) + tabular-annotation graph(index 1)
    if (this.transformationObj.graphs.length === 0) {
      this.transformationObj.graphs.push(new transformationDataModel.Graph('', []));
      this.transformationObj.graphs.push(graph);
    } else if (this.transformationObj.graphs.length === 1) { // if rdf-tree-mapping graph exists --> push tabular-annotation graph
      this.transformationObj.graphs.push(graph);
    } else if (this.transformationObj.graphs.length > 1) { // if tabular-annotation graph exists --> replace/update tabular-annotation graph
      this.transformationObj.graphs[1] = graph;
    }

    // Save the new transformation
    this.transformationObj.setAnnotations(this.annotationService.getAnnotations()); // save also warning and wrong annotations!
    this.transformationSvc.changeTransformationObj(this.transformationObj);
    this.saveLoading = false;
  }

  // /**
  //  * Retrieve the RDF triples
  //  * @param {string} rdfFormat specifies the RDF syntax
  //  */
  // retrieveRDF(rdfFormat: string = 'nt') {
  //   this.retrieveRDFLoading = true;
  //   const paramMap = this.route.snapshot.paramMap;
  //   if (paramMap.has('transformationId') && paramMap.has('filestoreId')) {
  //     const existingTransformationID = paramMap.get('transformationId');
  //     const filestoreID = paramMap.get('filestoreId');
  //     console.log(this.transformationObj);
  //     this.transformationSvc.transformFile(filestoreID, existingTransformationID, 'graft', rdfFormat).then(
  //       (transformed) => {
  //         console.log(transformed);
  //         this.retrieveRDFLoading = false;
  //       },
  //       (error) => {
  //         console.log('Error transforming file');
  //         console.log(error);
  //         this.retrieveRDFLoading = false;
  //       }
  //     );
  //   }
  //   this.retrieveRDFLoading = false;
  // }

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
          [this.getEmptyCondition(annotation.columnHeader)], // node conditions
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
          [this.getEmptyCondition(annotation.columnHeader)], // nodeCondition
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
          [this.getEmptyCondition(annotation.columnHeader)], // node conditions
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
   * Return the "empty" condition for the given column
   * @param columnHeader
   * @returns {transformationDataModel.Condition}
   */
  private getEmptyCondition(columnHeader) {
    const column = {'id': 0, 'value': columnHeader};
    const operator = {'id': 0, 'name': 'Not empty'};
    const conj = null;
    const operand = '';
    return new transformationDataModel.Condition(column, operator, operand, conj);
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
   * Help method that returns the prefix of a known namespace (by looking only at the rdfVocabs list).
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
   * Check if a vocab with the given prefix does not exist, i.e. the selected prefix is available.
   * @param {string} prefix
   * @returns {boolean} true if the given prefix is not already used in a vocab, false otherwise
   */
  private isPrefixAvailable(prefix: string) {
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
    if (existingPrefix) { // NOTE: modify RDFVocab instances to avoid getting errors from vocabulary service
      prefix = existingPrefix + '1';
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
      while (!this.isPrefixAvailable(prefix)) {
        const idx = prefix.lastIndexOf(String(i - 1));
        prefix = idx > 0 ? prefix + i : prefix.substr(0, idx) + i;
        ++i;
      }
    }
    // TODO: create a new RDFVocabulary instance
    this.transformationObj.rdfVocabs.push({name: prefix, namespace: namespace, fromServer: false});
    return prefix;
  }

  private createFunctionName(deriveFrom: string, deriveTo: string) {
    // Create a random element to append to the name function
    return `enrich${deriveFrom}to${deriveTo}${Date.now()}`;
  }

  /**
   * Create new columns using the existing deriveColumn function
   * @param colsToDeriveFromIdx
   * @param colsToDeriveFrom
   * @param deriveMaps
   * @param conciliator
   * @param shift
   */
  deriveColumnsFromEnrichment(colsToDeriveFromIdx: number, colsToDeriveFrom: string, deriveMaps: DeriveMap[],
                              conciliator: ConciliatorService, shift: boolean) {
    let newFunction: any = null;

    deriveMaps.forEach((deriveMap: DeriveMap, index) => {
      // Create a new custom function
      const fName = this.createFunctionName(String(colsToDeriveFromIdx), deriveMap.newColName);
      const fMap = deriveMap.toClojureMap();
      const fDescription = `Enrichment - ${colsToDeriveFrom} to ${deriveMap.newColName}}`;
      const clojureFunction = `(defn ${fName} "${fDescription}" [v] (get ${fMap} v ""))`;
      const enrichmentFunction = new transformationDataModel.CustomFunctionDeclaration(fName, clojureFunction, 'UTILITY', '');
      this.transformationObj.customFunctionDeclarations.push(enrichmentFunction);

      // Create the derive column step
      newFunction = new transformationDataModel.DeriveColumnFunction(deriveMap.newColName,
        [{id: colsToDeriveFromIdx, value: colsToDeriveFrom}],
        [new transformationDataModel.FunctionWithArgs(enrichmentFunction, [])], '');

      // Pipeline update
      this.transformationObj.pipelines[0].addAfter({}, newFunction);

      // Shift the new column next to the deriveFrom column
      if (shift) {
        newFunction = new transformationDataModel.ShiftColumnFunction(
          {id: this.enrichmentService.headers.length, value: deriveMap.newColName},
          colsToDeriveFromIdx + index + 1, 'position', '');
        this.transformationObj.pipelines[0].addAfter({}, newFunction);
      }

      // Mark this column as reconciled if a conciliator is given
      if (conciliator) {
        const reconciledColumn: ReconciledColumn = new ReconciledColumn(deriveMap, conciliator);
        this.enrichmentService.setReconciledColumn(reconciledColumn);
        this.transformationObj.setReconciledColumns(this.enrichmentService.getReconciledColumns());
      }

      // Annotate the derived column, if the DeriveMap comes with a property defined
      if (deriveMap.withProperty) {
        const annotation = new Annotation({
          columnHeader: deriveMap.newColName
        });
        // If there are col types, annotate the new column as URI col
        if (deriveMap.newColTypes.length > 0) {
          annotation.columnValuesType = ColumnTypes.URI;
          annotation.columnTypes = deriveMap.newColTypes.map((type: Type) => conciliator.getSchemaSpace() + type.id);
          annotation.urifyNamespace = conciliator.getIdentifierSpace();
        } else {
          annotation.columnValuesType = ColumnTypes.Literal;
          annotation.columnDatatype = XSDDatatypes.string;
        }
        if (deriveMap.withProperty.startsWith('http://')) {
          annotation.property = deriveMap.withProperty;
        } else {
          annotation.property = conciliator.getSchemaSpace() + deriveMap.withProperty;
        }
        annotation.subject = colsToDeriveFrom;

        this.annotationService.setAnnotation(deriveMap.newColName, annotation);
        this.transformationObj.setAnnotations(this.annotationService.getAnnotations());

      }
    });

    if (newFunction) {
      this.pipelineEventsSvc.changeSelectedFunction({
        currentFunction: {},
        changedFunction: newFunction
      });
      this.transformationSvc.changeTransformationObj(this.transformationObj);
      this.transformationSvc.changePreviewedTransformationObj(this.transformationObj.getPartialTransformation(newFunction));

      for (let i = 0; i < this.transformationObj.pipelines[0].functions.length - 1; ++i) {
        this.transformationObj.pipelines[0].functions.isPreviewed = false;
      }
    }
  }

}
