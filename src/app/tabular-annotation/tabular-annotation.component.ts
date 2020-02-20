import { Component, OnDestroy, OnInit } from '@angular/core';
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
import { RoutingService } from '../routing.service';
import { Annotation, ColumnTypes, XSDDatatypes } from './annotation.model';
import * as transformationDataModel from 'assets/transformationdatamodel.js';
import { AnnotationFormComponent } from './annotation-form/annotation-form.component';
import { MatDialog } from '@angular/material';
import { ConfigComponent } from './config/config.component';
import { Subscription } from 'rxjs';
import { EnrichmentService } from './enrichment/enrichment.service';
import { ConciliatorService, Type } from './enrichment/enrichment.model';
import { PipelineEventsService } from '../tabular-transformation/pipeline-events.service';
import { ReconciliationComponent } from './enrichment/reconciliation/reconciliation.component';
import { ExtensionComponent } from './enrichment/extension/extension.component';
import { UrlUtils } from './shared/url-utils';
import {ConstantURI} from 'assets/transformationdatamodel';

declare var Handsontable: any;

@Component({
  selector: 'app-tabular-annotation',
  templateUrl: './tabular-annotation.component.html',
  styleUrls: ['./tabular-annotation.component.css'],
})
export class TabularAnnotationComponent implements OnInit, OnDestroy {

  public geoNamesSources: string[];
  public categoriesSources: string[];

  private transformationObj: any;
  private graftwerkData: any;

  private transformationSubscription: Subscription;
  private previewedTransformationSubscription: Subscription;
  private dataSubscription: Subscription;
  private reconciliationServicesListSubscription: Subscription;

  private container: any;
  private settings: any;
  public hot: any;

  public saveLoading: boolean;
  public retrieveRDFLoading: boolean;
  public dataLoading: boolean;
  public formChoose = 0;

  public saveButtonDisabled: boolean;
  public rdfButtonDisabled: boolean;

  constructor(public dispatch: DispatchService, public transformationSvc: TransformationService,
    public annotationService: AnnotationService, public enrichmentService: EnrichmentService,
    private route: ActivatedRoute, private routingService: RoutingService, public dialog: MatDialog,
    private pipelineEventsSvc: PipelineEventsService) {
    route.url.subscribe(() => this.routingService.concatURL(route));
    this.saveLoading = false;
    this.retrieveRDFLoading = false;
    this.saveButtonDisabled = false;
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
          blockCalculations.cells = true;
          this.openAnnotationDialog(coords.col);
        } else if (event.target.parentNode.id.startsWith('enrich_') || event.realTarget.id.startsWith('enrich_')) {
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
      this.transformationSvc.transformationObjSource.subscribe((transformationObj) => {
        this.transformationObj = transformationObj;
      });


    this.previewedTransformationSubscription = this.transformationSvc.previewedTransformationObjSource
      .subscribe((previewedTransformation) => {
        this.dataLoading = true;
      });

    this.dataSubscription = this.transformationSvc.graftwerkDataSource.subscribe((graftwerkData) => {
      this.graftwerkData = graftwerkData;
      if (this.graftwerkData[':column-names'] && this.graftwerkData[':rows']) {
        // Clean header name (remove leading ':' from the EDN response)
        this.annotationService.headers = this.graftwerkData[':column-names'].map((h) => {
          return h.charAt(0) === ':' ? h.substr(1) : h;
        });
        // this.annotationService.data = this.graftwerkData[':rows'];

        // TODO we copy the entire loaded data and headers twice here - could this be optimised?
        this.enrichmentService.headers = this.graftwerkData[':column-names'].map((h) => {
          return h.charAt(0) === ':' ? h.substr(1) : h;
        });
        this.enrichmentService.data = this.graftwerkData[':rows'];

        // if (this.transformationObj['annotations']) {
        //   this.transformationObj['annotations'].forEach(annotationObj => {
        //     const annotation = new Annotation(annotationObj);
        //     this.annotationService.setAnnotation(annotation.columnHeader, annotation);
        //   });
        //   this.saveButtonDisabled = this.annotationService.getAnnotations().length === 0;
        // }

        // if (this.transformationObj['reconciledColumns']) {
        //   this.transformationObj['reconciledColumns'].forEach((recColObj) => {
        //     const reconciledCol = new ReconciledColumn(recColObj._deriveMap, recColObj._conciliator);

        //     // Check if the user has removed manually the reconciliation step from the pipeline
        //     if (this.transformationObj.pipelines[0].functions
        //       .filter(f => f.name === 'derive-column' && f.newColName === reconciledCol.getHeader())
        //       .length > 0) {
        //       this.enrichmentService.setReconciledColumn(reconciledCol);
        //     }
        //   });
        // }

        // this.transformationObj.setAnnotations(this.annotationService.getAnnotations()); // save also warning and wrong annotations!
        // this.transformationObj.setReconciledColumns(this.enrichmentService.getReconciledColumns());
        this.transformationSvc.transformationObjSource.next(this.transformationObj);

        this.hot.updateSettings({
          columns: this.getTableColumns(),
          colHeaders: (col) => this.getTableHeader(col)
        });
        this.hot.loadData(this.graftwerkData[':rows']);
      }
    });

    this.reconciliationServicesListSubscription = this.enrichmentService.listServices().subscribe((data) => {
      let tmpServices = new Map<string, ConciliatorService>();

      Object.keys(data).forEach((serviceCategory) => {
        data[serviceCategory].forEach((service) => {
          tmpServices.set(service['id'], new ConciliatorService({ ...service, ...{ 'group': serviceCategory } }));
        });
      });
      // update the behavior object containing services
      this.enrichmentService.reconciliationServicesMapSource.next(tmpServices);
    });

  }

  ngOnDestroy() {
    this.transformationSubscription.unsubscribe();
    this.dataSubscription.unsubscribe();
    this.previewedTransformationSubscription.unsubscribe();
    this.reconciliationServicesListSubscription.unsubscribe();
  }

  openAnnotationDialog(headerIdx): void {
    const columnName = this.graftwerkData[':column-names'][headerIdx];


    const currentHeader = columnName.charAt(0) === ':' ? columnName.substr(1) : columnName;
    const currentAnnotation = this.transformationObj.getColumnAnnotations(currentHeader)[0];
    const currentAnnotationId = currentAnnotation ? currentAnnotation.id : 0;

    const dialogRef = this.dialog.open(AnnotationFormComponent, {
      width: '750px',
      data: { header: currentHeader, annotationId: currentAnnotationId }
    });

    dialogRef.afterClosed().subscribe(result => {
      this.transformationObj.validateAnnotations();
      this.hot.updateSettings({
        columns: this.getTableColumns(),
        colHeaders: (col) => this.getTableHeader(col)
      });
      this.saveButtonDisabled = false /* this.annotationService.getAnnotations().length === 0 */;
    });
  }

  openConfigDialog(): void {
    const dialogRef = this.dialog.open(ConfigComponent, {
      width: '600px'
    });
  }

  openEnrichmentDialog(headerIdx): void {
    const currentHeader = this.annotationService.headers[headerIdx];
    const annotation = this.transformationObj.getColumnAnnotations(currentHeader)[0];

    let reconciliationServiceId = '';
    // let isReconciled = false;
    if (annotation) {
      reconciliationServiceId = annotation.conciliatorServiceName;
      // isReconciled = annotation.reconciliation ? true : false;
      // reconciliationServiceId = annotation.reconciliation;
    }

    if (this.transformationObj.isColumnResultOfExtension(currentHeader)) {
      let extension = this.transformationObj.getExtensionOfDerivedColumn(currentHeader);
      if (extension) {
        if (extension instanceof transformationDataModel.ReconciliationServiceExtension) {
          reconciliationServiceId = extension.reconciliationServiceId;
        } else if (extension instanceof transformationDataModel.EventExtension) {
          reconciliationServiceId = 'er';
        } else if (extension instanceof transformationDataModel.SameAsExtension) {
          reconciliationServiceId = 'sameas';
        } else if (extension instanceof transformationDataModel.ECMWFWeatherExtension) {
          reconciliationServiceId = 'ecmwf';
        } else if (extension instanceof transformationDataModel.KeywordsCategoriesExtension) {
          reconciliationServiceId = 'keywordcategories';
        }
      }
    }

    this.geoNamesSources = [];
    this.categoriesSources = [];

    // generate autocompletes for source columns that can be used for extension
    this.annotationService.headers.forEach((header: string) => {
      const annotation = this.transformationObj.getColumnAnnotations(header)[0];
      if (annotation) {
        if (annotation.conciliatorServiceName) {
          switch (annotation.conciliatorServiceName) {
            case 'geonames':
              this.geoNamesSources.push(header);
              // also add derived columns from GeoNames enrichments
              if (annotation.extensions) {
                annotation.extensions.forEach((extension) => {
                  if (extension instanceof transformationDataModel.ReconciliationServiceExtension) {
                    if (extension.reconciliationServiceId === 'geonames') {
                      for (let i = 0; i < extension.derivedColumns.length; ++i) {
                        this.geoNamesSources.push(extension.derivedColumns[i]);
                      }
                    }
                  }
                });
              }
              break;
            case 'productsservices':
            case 'keywordsmatcher':
              this.categoriesSources.push(header);
              break;
          }
        }
      }
    });

    let dialogRef;
    // const dialogConfig = {
    //   width: '900px',
    //   data: { header: currentHeader, indexCol: headerIdx, reconciliationServiceId: reconciliationServiceId, colDate: false }
    // };
    const dialogConfigExtension = {
      width: '900px',
      data: {
        header: currentHeader,
        indexCol: headerIdx,
        reconciliationServiceId: reconciliationServiceId,
        colDate: false,
        keywordColumn: false,
        geoSources: this.geoNamesSources,
        categoriesSources: this.categoriesSources
      }
    };
    const dialogConfigDateColumn = { ...dialogConfigExtension, ...{ data: { ...dialogConfigExtension.data, ...{ colDate: true } } } };
    const dialogConfigKeywordColumn = { ...dialogConfigExtension, ...{ data: { ...dialogConfigExtension.data, ...{ colKeyword: true } } } };
    const dialogConfigEventColumn = { ...dialogConfigExtension, ...{ data: { ...dialogConfigExtension.data, ...{ colEvent: true } } } };
    const dialogConfigReconciliation = {
      width: '900px',
      data: { header: currentHeader, indexCol: headerIdx, colDate: false }
    };

    if (reconciliationServiceId || this.transformationObj.isColumnResultOfExtension(currentHeader)) {
      if (annotation) { // to check if it's a date column
        if (annotation instanceof transformationDataModel.URINodeAnnotation) {
          const shortTypes = annotation.columnTypes.map((type: transformationDataModel.ConstantURI) => type.constant.substr(UrlUtils.getNamespaceFromURL(new URL(type.constant)).length));
          if (shortTypes.includes('Event')) {
            dialogRef = this.dialog.open(ExtensionComponent, dialogConfigEventColumn);
          } else {
            dialogRef = this.dialog.open(ExtensionComponent, dialogConfigExtension);
          }
        } else {
          const type = annotation.columnDatatype;
          const shortType = type.substr(UrlUtils.getNamespaceFromURL(new URL(type.constant)).length);
          if (shortType === 'dateTime') { // it's a date column --> open dialogConfigDateCOlumn
            dialogRef = this.dialog.open(ExtensionComponent, dialogConfigDateColumn);
          } else if (shortType === 'keyword') { // it's a keyword column -> open dialogConfigKeywordColumn
            dialogRef = this.dialog.open(ExtensionComponent, dialogConfigKeywordColumn);
          } else {
            dialogRef = this.dialog.open(ExtensionComponent, dialogConfigExtension);
          }
        }

      } else {
        dialogRef = this.dialog.open(ExtensionComponent, dialogConfigExtension);
      }
    } else if (annotation) {
      if (annotation instanceof transformationDataModel.URINodeAnnotation) {
        const shortTypes = annotation.columnTypes.map((type: transformationDataModel.ConstantURI) => type.constant.substr(UrlUtils.getNamespaceFromURL(new URL(type.constant)).length));
        if (shortTypes.includes('Event')) {
          dialogRef = this.dialog.open(ExtensionComponent, dialogConfigEventColumn);
        } else {
          // to do
          dialogRef = this.dialog.open(ReconciliationComponent, dialogConfigReconciliation);
        }
      } else {
        const type = annotation.columnDatatype;
        const shortType = type.substr(UrlUtils.getNamespaceFromURL(new URL(type)).length);
        if (shortType === 'dateTime') {// it's a dateColumn --> open dialogConfigDateCOlumn
          dialogRef = this.dialog.open(ExtensionComponent, dialogConfigDateColumn);
        } else if (shortType === 'keyword') {
          dialogRef = this.dialog.open(ExtensionComponent, dialogConfigKeywordColumn);
        } else {// it's not a dateColumn or keywordColumn --> open a normal ReconciliationComponent
          dialogRef = this.dialog.open(ReconciliationComponent, dialogConfigReconciliation);
        }
      }

    } else { // it's not reconcled and not annotated column so --> open ReconciliationComponent
      dialogRef = this.dialog.open(ReconciliationComponent, dialogConfigReconciliation);
    }

    dialogRef.afterClosed().subscribe(result => {
      this.transformationObj.validateAnnotations();


      /*  if (result && result['chosen']){//open reconciliation form

          this.formChoose = result['chosen'];
          this.openEnrichmentDialog(headerIdx);
          this.formChoose = 0;

        }
        else */
      // if (result && result['deriveMaps']) {
      //   this.deriveColumnsFromEnrichment(
      //     result['header'],
      //     result['deriveMaps'],
      //     result['conciliator'],
      //     result['conciliatorTo'],
      //     result['shift']);

      // }
      // Update headers (some columns might have been annotated)
      this.hot.updateSettings({
        columns: this.getTableColumns(),
        colHeaders: (columnIndex) => this.getTableHeader(columnIndex)
      });
    });

  }

  getTableColumns() {
    return this.graftwerkData[':column-names'].map(h => {
      // TODO in case we ever implement multiple annotations per column - change code below
      const ann = this.transformationObj.getColumnAnnotations(h.charAt(0) === ':' ? h.substr(1) : h)[0];
      if (ann && ann instanceof transformationDataModel.URINodeAnnotation) {
        return ({
          data: h, // don't remove leading ':' from header here!
          renderer: (instance, td, row, col, prop, value, cellProperties) => {
            const annotation = this.transformationObj.getColumnAnnotations(h.charAt(0) === ':' ? h.substr(1) : h)[0];
            td.className = 'htCenter htMiddle htDimmed';
            if (value) {
              const namespaceURIVocab = this.transformationObj.rdfVocabs.find((vocab) => {
                return vocab.name === annotation.urifyPrefix;
              }) || '';

              td.innerHTML = `<a href="${namespaceURIVocab ? namespaceURIVocab.namespace : ''}${value}" target="_blank">${value}</a>`;
            } else {
              td.innerHTML = '';
            }
            return td;
          }
        });
      } else {
        return { data: h }; // don't remove leading ':' from header here!
      }
    });
  }

  /**
   * Creates the HTML for displaying the enrichment button of a column.
   * @param  {string} columnName name of column
   * @param  {number} colIndex index of column
   * @returns HTML code for enrichment button
   */
  getEnrichmentButtonHTMLHeader(columnName: string, colIndex: number) {
    const annotation = this.transformationObj.getColumnAnnotations(columnName)[0];
    let HTMLHeader = '';
    let buttonHTML = '';
    let tooltipContent = '';

    let reconciledColumnAnnotation = this.transformationObj.getAnnotationForReconciledColumn(columnName);
    if (reconciledColumnAnnotation) {
      // column has been used for reconciliation - editing should be possible
      buttonHTML = '<button class="btn btn-sm btn-link btn-icon" id="enrich_ ' + colIndex + '">' +
        '<i class="material-icons top-margin" style="color:green;"> insert_link </i>' +
        '</button>';
      tooltipContent = 'Edit reconciliation';
    } else {
      if (annotation) {
        if (annotation.reconciliation || this.transformationObj.isColumnResultOfExtension(columnName)) {
          if (annotation instanceof transformationDataModel.URINodeAnnotation) {
            // the column is the result of a reconciliation or extension, so users should be able to extend it
            // only URI columns can be used to extend though
            buttonHTML = '<button class="btn btn-sm btn-link btn-icon" id="enrich_ ' + colIndex + '">' + '<i class="material-icons top-margin" > post_add </i>' + '</button>';
            tooltipContent = 'Extend dataset';
          } else {
            // only date literal annotations can be used in extensions
            const type = annotation.columnDatatype;
            const shortType = type ? type.substr(UrlUtils.getNamespaceFromURL(new URL(type)).length) : '';
            if (shortType === 'dateTime' || shortType === 'keyword') {
              buttonHTML = '<button class="btn btn-sm btn-link btn-icon" id="enrich_ ' + colIndex + '">' + '<i class="material-icons top-margin" > post_add </i>' + '</button>';
              tooltipContent = 'Extend dataset';
            }
          }
        } else {
          // column has been annotated but not as a result of a reconciliation - we check if it is some specific type
          if (annotation instanceof transformationDataModel.URINodeAnnotation) {
            const shortTypes = annotation.columnTypes.map((type: transformationDataModel.ConstantURI) => type.constant.substr(UrlUtils.getNamespaceFromURL(new URL(type.constant)).length));
            if (shortTypes.includes('Event')) {
              buttonHTML = '<button class="btn btn-sm btn-link btn-icon" id="enrich_ ' + colIndex + '">' + '<i class="material-icons top-margin" > post_add </i>' + '</button>';
              tooltipContent = 'Extend dataset';
            } else {
              buttonHTML = '<button class="btn btn-sm btn-link btn-icon" id="enrich_ ' + colIndex + '">' + '<i class="material-icons top-margin" > insert_link </i>' + '</button>';
              tooltipContent = 'Reconcile column';
            }
          } else {
            // must be Literal node annotation
            const type = annotation.columnDatatype;
            const shortType = type ? type.substr(UrlUtils.getNamespaceFromURL(new URL(type)).length) : '';

            switch (shortType) {
              // here should be all of the exceptions when extension should be the possible option
              case 'dateTime':
              case 'keyword':
                // extension
                buttonHTML = '<button class="btn btn-sm btn-link btn-icon" id="enrich_ ' + colIndex + '">' + '<i class="material-icons top-margin" > post_add </i>' + '</button>';
                tooltipContent = 'Extend dataset';
                break;
              default:
                // by default the button should be about reconciliation
                // buttonHTML = '<button class="btn btn-sm btn-link btn-icon" id="enrich_ ' + colIndex + '">' + '<i class="material-icons top-margin" > insert_link </i>' + '</button>';
                // tooltipContent = 'Reconcile column';
                // tooltipContent = 'Cannot reconcile - column already annotated';
                break;
            }
          }
        }

      } else {
        // reconciliation for sure
        buttonHTML = '<button class="btn btn-sm btn-link btn-icon" id="enrich_ ' + colIndex + '">' + '<i class="material-icons top-margin" > insert_link </i>' + '</button>';
        tooltipContent = 'Reconcile column';
      }
    }
    if (buttonHTML) {
      HTMLHeader +=
        '<label role="tooltip" aria-haspopup="true" class="tooltip tooltip-sm tooltip-bottom-left">' + // label start
        buttonHTML +
        '<span class="tooltip-content">' + tooltipContent + '</span>' + '</label>'; // tooltip and label end
    }

    return HTMLHeader;
  }

  /**
   * Return the HTML template as string for the given column
   * @param colIndex
   * @returns {string}
   */
  getTableHeader(colIndex): string {
    let headerName = this.graftwerkData[':column-names'][colIndex];
    headerName = headerName.charAt(0) === ':' ? headerName.substr(1) : headerName;
    // const headerName = this.annotationService.headers[col];
    // const annotation = this.annotationService.getAnnotation(headerName);
    const annotation = this.transformationObj.getColumnAnnotations(headerName)[0];
    const buttonIconShape = annotation ? 'edit' : 'add';
    let HTMLHeader = headerName +
      '<button class="btn btn-sm btn-link btn-icon" id="annotation_ ' + colIndex + '">' +
      '<i class="material-icons" >' + buttonIconShape + ' </i>' +
      '</button>';
    if (annotation) {
      // STATUS ICON
      let statusIcon = '';
      let tooltipContent = '';
      if (annotation.status === transformationDataModel.AnnotationStatus.invalid) {
        statusIcon = '<i class="material-icons" style="color:red	;">error</i>';
        tooltipContent = 'This column is not correctly annotated';
      } else if (annotation.status === transformationDataModel.AnnotationStatus.warning) {
        statusIcon = '<i class="material-icons" style="color:Gold	;">warning</i>';
        if (annotation.subjectAnnotationId) {
          const tmpAnno = this.transformationObj.getAnnotationById(annotation.subjectAnnotationId);
          tooltipContent = 'This column annotation depends on <i>' + tmpAnno.columnName + '</i> column, which is not correctly annotated';
        } else {
          tooltipContent = 'This column annotation has no subject';
        }
      } else if (annotation.status === transformationDataModel.AnnotationStatus.valid) {
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

    HTMLHeader += this.getEnrichmentButtonHTMLHeader(headerName, colIndex);


    if (annotation) {
      HTMLHeader += '<br>';

      // ANNOTATION DETAILS
      let annInfoLabel: string;
      let annInfoTypes: string;
      let annInfoValues: string;

      // TYPES
      if (annotation instanceof transformationDataModel.URINodeAnnotation) {
        annInfoLabel = '<p class="p7 ann-info-label">Type(s):</p>';
        annInfoTypes = '';
        for (let i = 0; i < annotation.columnTypes.length; ++i) {

          const qualifiedTypeString = this.transformationObj.getConstantURINodeFullyQualifiedName(annotation.columnTypes[i]);
          const shortType = qualifiedTypeString.substr(UrlUtils.getNamespaceFromURL(new URL(qualifiedTypeString)).length);
          annInfoTypes += '<span class="p7 ann-info-types" title="' + qualifiedTypeString + '">' + shortType + '</span>';
        }
      } else {
        annInfoLabel = '<p class="p7 ann-info-label">Datatype:</p>';
        const type = annotation.columnDatatype;
        const shortType = type.substr(UrlUtils.getNamespaceFromURL(new URL(type)).length);

        annInfoTypes = '<span class="p7 ann-info-types" title="' + type + '">' + shortType + '</span>';
      }
      annInfoValues = '<div class="ann-info-values">' + annInfoTypes + '</div>';
      HTMLHeader += '<div class="header-ann-info">' + annInfoLabel + annInfoValues + '</div>';

      if (annotation.subjectAnnotationId) {
        // PROPERTY
        if (annotation.properties.length > 0) {
          annInfoLabel = '<p class="p7 ann-info-label">Prop:</p>';
          const propFQN = this.transformationObj.getPropertyNodeFullyQualifiedName(annotation.properties[0]);
          const shortName = propFQN.substr(UrlUtils.getNamespaceFromURL(new URL(propFQN)).length);
          const annInfoProp = '<span class="p7 ann-info-prop" title="' + propFQN + '">' + shortName + '</span>';
          annInfoValues = '<div class="ann-info-values">' + annInfoProp + '</div>';
          HTMLHeader += '<div class="header-ann-info">' + annInfoLabel + annInfoValues + '</div>';
        }
        // SOURCE
        annInfoLabel = '<p class="p7 ann-info-label">SourceCol:</p>';
        const subjectAnnotation = this.transformationObj.getAnnotationById(annotation.subjectAnnotationId);
        const annInfoSource = '<span class="p7 ann-info-source">' + (subjectAnnotation ? subjectAnnotation.columnName : '') + '</span>';
        annInfoValues = '<div class="ann-info-values">' + annInfoSource + '</div>';
        HTMLHeader += '<div class="header-ann-info">' + annInfoLabel + annInfoValues + '</div>';
      }
    }


    let reconciledColumnAnnotation = this.transformationObj.getAnnotationForReconciledColumn(headerName);
    if (reconciledColumnAnnotation) {
      // reconciled column
      HTMLHeader += '<br>';
      let annInfoReconciledInColumn: string;
      annInfoReconciledInColumn = '<p class="p7 ann-info-label">Reconciled:</p>';
      annInfoReconciledInColumn += '<div class="ann-info-values"><span class="p7 ann-info-reconciliations">' + reconciledColumnAnnotation.columnName + '</span></div>';
      // annInfoReconciledInColumn += '<div class="ann-info-values">' + reconciledColumnAnnotation.columnName + '</div>';
      HTMLHeader += '<div class="header-ann-info">' + annInfoReconciledInColumn + '</div>';
    }
    return HTMLHeader;
  }

  /**
   * Create a valid graph using all annotations and save it into the transformation object.
   */
  updateRDFMappings() {
    this.saveLoading = true;

    let colNames = this.graftwerkData[':column-names'].map((h) => {
      return h.charAt(0) === ':' ? h.substr(1) : h;
    });


    /*
    // temp code for testing of annotation model
    let type1 = new transformationDataModel.ConstantURI('', "http://xmlns.com/foaf/0.1/Person", [], []);
    let subjectAnnotation = new transformationDataModel.URINodeAnnotation(
      colNames[0], // col name
      null, // subject annotation ID
      null, // properties
      [type1], // column types
      this.getPrefixForNamespace("http://www.example.com/"), // Namespace URI
      true, // is Subject?
      "valid", // status
      this.transformationObj.getUniqueId(), // id
      "geonames", // conciliator name
      [], // extensions
      null // reconciliation
    );

    let property1 = new transformationDataModel.Property('', 'http://www.w3.org/2000/01/rdf-schema#label', [], []);

    let literalObjectAnnotation = new transformationDataModel.LiteralNodeAnnotation(
      colNames[1],
      subjectAnnotation.id, // subject annotation ID
      [property1], // properties
      "http://www.w3.org/2001/XMLSchema#string", // datatype
      "en", // lang tag
      "valid", // status
      this.transformationObj.getUniqueId() // id
    );

    let property2 = new transformationDataModel.Property('', 'http://xmlns.com/foaf/0.1/knows', [], []);
    let uriObjectAnnotation = new transformationDataModel.URINodeAnnotation(
      colNames[2], // col name
      subjectAnnotation.id, // subject annotation ID
      [property2], // properties
      [type1], // column types
      this.getPrefixForNamespace("http://www.example.com/"), // Namespace URI
      false, // is Subject?
      "valid", // status
      this.transformationObj.getUniqueId(), // id
      "geonames", // conciliator name
      [], // extensions
      null // reconciliation
    );
    this.transformationObj.annotations = [];
    this.transformationObj.addOrReplaceAnnotation(subjectAnnotation);
    this.transformationObj.addOrReplaceAnnotation(literalObjectAnnotation);
    this.transformationObj.addOrReplaceAnnotation(uriObjectAnnotation);
    this.transformationSvc.transformationObjSource.next(this.transformationObj); */

    // Update headers (some columns might have been annotated)
    this.hot.updateSettings({
      columns: this.getTableColumns(),
      colHeaders: (col) => this.getTableHeader(col)
    });

    let validAnnotations = this.transformationObj.getValidAnnotations();
    let graph = this.buildGraph(validAnnotations);
    if (this.transformationObj.graphs.length === 0) {
      this.transformationObj.graphs.push(new transformationDataModel.Graph('', []));
      this.transformationObj.graphs.push(graph);
    } else if (this.transformationObj.graphs.length === 1) { // if rdf-tree-mapping graph exists --> push tabular-annotation graph
      this.transformationObj.graphs.push(graph);
    } else if (this.transformationObj.graphs.length > 1) { // if tabular-annotation graph exists --> replace/update tabular-annotation graph
      this.transformationObj.graphs[1] = graph;
    }

    this.transformationSvc.transformationObjSource.next(this.transformationObj);

    // let annotations = this.annotationService.getValidAnnotations();

    // /**
    //  * Create prefixes and namespaces for all properties, types and datatypes.
    //  * Insert also new prefixes and namespaces into the RDFvocabs array
    //  */
    // annotations = this.updatePrefixesNamespaces(annotations);

    // // Create a new instance of graph
    // const graph = this.buildGraph(annotations);
    // // if empty graph array --> push new rdf-tree-mapping graph(index 0) + tabular-annotation graph(index 1)


    // // Save the new transformation
    // this.transformationObj.setAnnotations(this.annotationService.getAnnotations()); // save also warning and wrong annotations!
    // this.transformationSvc.transformationObjSource.next(this.transformationObj);
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
        annotation.columnTypesNamespace.push(UrlUtils.getNamespaceFromURL(new URL(annotation.columnTypes[i])));
        annotation.columnTypesPrefix.push(this.getPrefixForNamespace(annotation.columnTypesNamespace[i]));
      }

      if (annotation.columnDatatype !== '') {
        annotation.columnDatatypeNamespace = UrlUtils.getNamespaceFromURL(new URL(annotation.columnDatatype));
        annotation.columnDatatypePrefix = this.getPrefixForNamespace(annotation.columnDatatypeNamespace);
      }

      if (annotation.property !== '') {
        annotation.propertyNamespace = UrlUtils.getNamespaceFromURL(new URL(annotation.property));
        annotation.propertyPrefix = this.getPrefixForNamespace(annotation.propertyNamespace);
      }
    });
    return annotations;
  }


  calculateAnnotationDepth(annotation: any, alreadyTraversed: Set<number> = new Set()) {
    if (annotation instanceof transformationDataModel.Annotation) {
      if (annotation.subjectAnnotationId) {
        // cycle safety first!
        if (!alreadyTraversed.has(annotation.subjectAnnotationId)) {
          alreadyTraversed.add(annotation.subjectAnnotationId);
          return 1 + this.calculateAnnotationDepth(this.transformationObj.getAnnotationById(annotation.subjectAnnotationId), alreadyTraversed);
        } else {
          return 1;
        }
      }
    }
    return 1;
  }

  /**
   * Return a new Graph, identified by its URI; tricky because our graphs are S-P-O and we can get annotations with larger depth, which needs to be identified and flattened
   * @param {any[]} annotations
   * @param {string} graphURI
   * @returns {transformationDataModel.Graph}
   */
  buildGraph(annotations: any[], graphURI = 'http://eubusinessgraph.eu/#/') {

    let annotationsWithSubelements = annotations.map((annotation) => {
      return { annotation: annotation, subelements: [] };
    });

    // // sort by depth
    // annotationsWithSubelements.sort((a1, a2) => {
    //   if (a1.depth < a2.depth) {
    //     return 1;
    //   }
    //   return -1;
    // });

    // add sub-elements for each annotation
    annotations.forEach((annotation) => {
      if (annotation.subjectAnnotationId) {
        // get subject annotation
        let anno = this.transformationObj.getAnnotationById(annotation.subjectAnnotationId);
        // attach object (always the current annotation) to the property node
        annotation.properties.forEach((property) => {
          if (property.subElements.length) {
            property.subElements.splice(1);
            property.subElements[0] = annotation.getGraphNode();
          } else {
            property.subElements.push(annotation.getGraphNode());
          }
        });

        // find the annotation to which this object annotation is related and attach the property-object pairs
        let subjectAnno = annotationsWithSubelements.find((awd) => {
          return awd.annotation === anno;
        });
        subjectAnno.subelements = subjectAnno.subelements.concat(annotation.properties);
      }
    });

    // get all graph roots - i.e., all nodes with depth 1 less than the maximum (or less)
    let graphRootNodes = annotationsWithSubelements.filter((annotationWithSubels) => {
      return annotationWithSubels.subelements.length > 0;
    }).map((rootAnnoWithSubEls) => {
      // create the array of ColumnURI nodes that will be the graph roots and add all their elements
      let colUriNode = rootAnnoWithSubEls.annotation.getGraphNode();

      // add the type mappings if any
      if (rootAnnoWithSubEls.annotation instanceof transformationDataModel.URINodeAnnotation) {
        rootAnnoWithSubEls.annotation.columnTypes.forEach((annoTypeConstantURINode) => {
          colUriNode.subElements.push(new transformationDataModel.Property('rdf', 'type', [], [annoTypeConstantURINode]));
        });
      }

      // create a deep copy of the array of properties and revive them
      let propsDeepCopy = JSON.parse(JSON.stringify(rootAnnoWithSubEls.subelements)).map((propNode) => {
        // eliminate unnecessary depth of graph unless we have a blank node (we only use 2-depth mappings)
        if (propNode.subElements[0].__type === 'BlankNode') {
          propNode.subElements[0].subElements[0].subElements[0].subElements = []
        } else {
          propNode.subElements[0].subElements = [];
        }
        return transformationDataModel.Property.revive(propNode);
      });
      colUriNode.subElements = colUriNode.subElements.concat(propsDeepCopy);
      return colUriNode;
    });

    // add mapping triples for any other typed elements apart from the root nodes
    let leafNodeTypeNodes = [];

    annotationsWithSubelements.filter((annotationWithSubels) => {
      return annotationWithSubels.subelements.length === 0;
    }).forEach((annoWithDepth) => {
      // add the type mappings if any of the leaves are URI node annotations with types
      if (annoWithDepth.annotation instanceof transformationDataModel.URINodeAnnotation) {
        let colUriNode = annoWithDepth.annotation.getGraphNode();
        annoWithDepth.annotation.columnTypes.forEach((annoTypeConstantURINode) => {
          colUriNode.subElements.push(new transformationDataModel.Property('rdf', 'type', [], [annoTypeConstantURINode]));
        });
        leafNodeTypeNodes.push(colUriNode);
      }
    });


    let gr = new transformationDataModel.Graph(graphURI, graphRootNodes.concat(leafNodeTypeNodes));
    return gr;
    // return new transformationDataModel.Graph(graphURI, graphRootNodes.concat(leafNodeTypeNodes));
  }

  /**
   * Return the "empty" condition for the given column
   * @param columnHeader
   * @returns {transformationDataModel.Condition}
   */
  private getEmptyCondition(columnHeader) {
    const column = { 'id': 0, 'value': columnHeader };
    const operator = { 'id': 0, 'name': 'Not empty' };
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
    let prefix = this.getExistingPrefixFromNamespace(namespace);

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
      while (!this.isPrefixAvailable(tmpPrefix)) {
        tmpPrefix = prefix + i;
        ++i;
      }
      prefix = tmpPrefix;
      // create a new RDFVocabulary instance
      this.transformationObj.rdfVocabs.push(new transformationDataModel.RDFVocabulary(prefix, namespace, [], []));
    }
    return prefix;
  }

  private createFunctionName(deriveFrom: string, deriveTo: string) {
    // Create a random element to append to the name function
    return `enrich${deriveFrom}to${deriveTo}${Date.now()}`;
  }

  //   /**
  //    * Create new columns using the existing deriveColumn function
  //    * @param colsToDeriveFrom
  //    * @param deriveMaps
  //    * @param conciliator
  //    * @param conciliatorTo
  //    * @param shift
  //    */
  //   deriveColumnsFromEnrichment(colsToDeriveFrom: string, deriveMaps: DeriveMap[],
  //     conciliator: ConciliatorService, conciliatorTo: ConciliatorService, shift: boolean) {
  //     let newFunction: any = null;

  //     const colsToDeriveFromIdx = this.enrichmentService.headers.indexOf(colsToDeriveFrom);

  //     deriveMaps.forEach((deriveMap: DeriveMap, index) => {
  //       // Create a new custom function
  //       const fName = this.createFunctionName(String(colsToDeriveFromIdx), deriveMap.newColName);
  //       const fDescription = `Enrichment - ${colsToDeriveFrom} to ${deriveMap.newColName}}`;
  //       const clojureFunction = deriveMap.asClojureDeriveFunction(fName, fDescription, '');
  //       const enrichmentFunction = new transformationDataModel.CustomFunctionDeclaration(fName, clojureFunction, 'UTILITY', '');
  //       this.transformationObj.customFunctionDeclarations.push(enrichmentFunction);

  //       // Create the derive column step
  //       newFunction = new transformationDataModel.DeriveColumnFunction(deriveMap.newColName,
  //         [{ id: colsToDeriveFromIdx, value: colsToDeriveFrom }]
  //           .concat(deriveMap.fromCols.map(col => ({ id: this.enrichmentService.headers.indexOf(col), value: col }))),
  //         [new transformationDataModel.FunctionWithArgs(enrichmentFunction, [])], '');

  //       // Pipeline update
  //       this.transformationObj.pipelines[0].addAfter({}, newFunction);

  //       // Shift the new column next to the deriveFrom column
  //       if (shift) {
  //         newFunction = new transformationDataModel.ShiftColumnFunction(
  //           { id: this.enrichmentService.headers.length, value: deriveMap.newColName },
  //           colsToDeriveFromIdx + index + 1, 'position', '');
  //         this.transformationObj.pipelines[0].addAfter({}, newFunction);
  //       }

  //       // Mark this column as reconciled if a conciliator is given

  //       // Annotate the derived column, if
  //       // - the DeriveMap comes with a property defined (extension with property)
  //       // - the DeriveMap contains types (reconciled entity)
  //       // TODO: annotate columns extended by the sameAs service
  //       if (deriveMap.withProperty || deriveMap.newColTypes.length > 0) {
  //         const annotation = new Annotation({
  //           columnHeader: deriveMap.newColName
  //         });
  //         // If there are col types, annotate the new column as URI col of that types and reconcile its values
  //         if (deriveMap.newColTypes.length > 0) {
  //           annotation.columnValuesType = ColumnTypes.URI;
  //           annotation.columnTypes = deriveMap.newColTypes.map((type: Type) => conciliator.getSchemaSpace() + type.id);
  //           annotation.urifyNamespace = conciliator.getIdentifierSpace();

  //           const reconciledColumn: ReconciledColumn = new ReconciledColumn(deriveMap, conciliator);
  //           this.enrichmentService.setReconciledColumn(reconciledColumn);
  //           this.transformationObj.setReconciledColumns(this.enrichmentService.getReconciledColumns());

  //         } else if (deriveMap.newColDatatype) { // annotate as Literal
  //           annotation.columnValuesType = ColumnTypes.Literal;
  //           annotation.columnDatatype = deriveMap.newColDatatype;
  //         }
  //         // Check if this column has a subject
  //         if (deriveMap.withProperty) {
  //           if (deriveMap.withProperty.startsWith('http://')) {
  //             annotation.property = deriveMap.withProperty;
  //           } else {
  //             annotation.property = conciliator.getSchemaSpace() + deriveMap.withProperty;
  //           }
  //           annotation.subject = colsToDeriveFrom;
  //         }

  //         // Handle exceptions from ASIA - it should never be false
  //         if (annotation.columnValuesType) {
  //           ///// TODO //////
  //           ///// TODO //////
  //           ///// TODO //////
  //           ///// TODO //////
  //           // this.annotationService.setAnnotation(deriveMap.newColName, annotation);
  //           // this.transformationObj.setAnnotations(this.annotationService.getAnnotations());
  //         }
  //       }
  //     });

  //     if (newFunction) {
  //       this.pipelineEventsSvc.changeSelectedFunction({
  //         currentFunction: {},
  //         changedFunction: newFunction
  //       });
  //       this.transformationSvc.transformationObjSource.next(this.transformationObj);
  //       this.transformationSvc.previewedTransformationObjSource.next(this.transformationObj.getPartialTransformation(newFunction));
  //       for (let i = 0; i < this.transformationObj.pipelines[0].functions.length - 1; ++i) {
  //         this.transformationObj.pipelines[0].functions.isPreviewed = false;
  //       }
  //     }
  //   }

}
