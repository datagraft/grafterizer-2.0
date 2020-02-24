import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatTableDataSource } from '@angular/material';
import { EnrichmentService } from '../enrichment.service';
import { ConciliatorService, EventConfigurator, Extension, Property, WeatherConfigurator } from '../enrichment.model';
import { HttpClient } from '@angular/common/http';
import { UrlUtils } from '../../shared/url-utils';
import { Observable, Subscription } from 'rxjs';
import { TransformationService } from 'app/transformation.service';
import * as transformationDataModel from 'assets/transformationdatamodel.js';
import { AnnotationService } from 'app/tabular-annotation/annotation.service';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';

export class CustomEventFilterModel {
  propertyId?: string;
  operator?: string;
  propertyValue?: string;
  constructor(propertyId, operator, propertyValue) {
    if (propertyId) {
      this.propertyId = propertyId;
    }
    if (operator) {
      this.operator = operator;
    }
    if (propertyValue) {
      this.propertyValue = propertyValue;
    }
  }
}

@Component({
  selector: 'app-extension',
  templateUrl: './extension.component.html',
  styleUrls: ['./extension.component.css']
})
export class ExtensionComponent implements OnInit {
  public isGeonamesColumn = false;
  public isCategoriesColumn = false;
  public dataSource: any;
  public categorySuggestions: any;
  public header: any;
  public previewHeader: any;
  public colIndex: any;
  public isColDate: boolean;
  public isColKeyword: boolean;
  public isColEvent: boolean;
  public extensionData: Extension[];
  public propertyDescriptions: Map<string, Property>;
  public extensionServices: ConciliatorService[];
  public showPreview: boolean;
  public selectedProperties: any[];
  public alreadyExtendedProperties: string[];
  public previewProperties: string[];
  public selectedServiceId: string;
  public servicesGroups: string[];
  public allowedSources: string[];
  public geoAllowedSources: string[];
  public categoriesAllowedSources: string[];
  public geoSources: string[];
  public categoriesSources: string[];
  public readDatesFromCol: string;
  public readPlacesFromCol: string;
  public readCategoriesFromCol: string;
  public selectedDate: any;
  public selectedPlace: any;
  public selectedCategory: any;
  public weatherParameters: string[];
  public weatherParametersDescriptions: any;
  public weatherAggregators: string[];

  public weatherOffsets: number[];
  public selectedWeatherParameters: any[];
  public selectedWeatherOffsets: any[];
  public selectedWeatherAggregators: any[];
  public selectedKGService: string;
  public dateChoice: any;
  public placeChoice: any;
  public categoryChoice: any;
  public dataLoading: boolean;
  public reconciledFromService: ConciliatorService = new ConciliatorService({});
  public reconciledToService: ConciliatorService; // useful for sameAs extensions
  public shiftColumn = false;
  public selectedChipsPlaces: any = [];
  public selectedChipsCategories: any = [];

  public kgServices: ConciliatorService[];
  public extendOnCols: string[];

  public selectedEventProperties: string[];
  public dateOperators: string[];
  public group: any;
  public filters: FormArray;
  public dateExtensionDisplayedColumns = ['propertyId', 'operator', 'propertyValue', 'actions'];
  public propertiesID: string[] = [];
  public operators: string[] = [];
  public propertiesValue: string[] = [];
  // TODO: is it always true that propertyValue is equal to header??
  public defaultFilter: CustomEventFilterModel = {
    propertyId: 'startDate',
    operator: '==',
    propertyValue: this.header
  };
  public dateExtensionDataSource: MatTableDataSource<any>;
  public eventProperties: string[] = [];
  public maStartDate: any;
  public maEndDate: any;
  public features: string[];
  public selectedFeatures: any;
  public countries: string[];
  public selectedCountry: any;

  private kgServicesSubscription: Subscription;
  private transformationSubscription: Subscription;
  private reconciliationServicesMapSubscription: Subscription;
  private transformationObj: any;
  private currentExtension: any;
  currentAnnotation: any = { extensions: [] };
  editOrCreateNew = 'create-new';
  selectedExtension: any = {};

  public reconciliationServicesMap: Map<string, ConciliatorService>;
  private sameAsSource: ConciliatorService;

  @ViewChild('inputCategoriesChips') inputCategoriesChips: ElementRef<HTMLInputElement>;
  @ViewChild('inputPLaceChips') inputPLaceChips: ElementRef<HTMLInputElement>;

  constructor(public dialogRef: MatDialogRef<ExtensionComponent>,
    private http: HttpClient,
    @Inject(MAT_DIALOG_DATA) public dialogInputData: any,
    public enrichmentService: EnrichmentService, public transformationSvc: TransformationService,
    public annotationService: AnnotationService) {
  }

  ngOnInit() {
    this.header = this.dialogInputData.header;
    this.previewHeader = this.header;
    this.geoSources = this.dialogInputData.geoSources;
    this.geoAllowedSources = this.geoSources;
    this.categoriesSources = this.dialogInputData.categoriesSources;
    this.categoriesAllowedSources = this.categoriesSources;
    this.colIndex = this.dialogInputData.indexCol;
    this.isColDate = this.dialogInputData.colDate;
    this.isColKeyword = this.dialogInputData.colKeyword;
    this.isColEvent = this.dialogInputData.colEvent;
    this.showPreview = false;
    this.dataLoading = false;
    this.extensionData = [];
    this.propertyDescriptions = new Map();
    this.allowedSources = this.enrichmentService.headers.filter(h => h !== this.header);
    this.selectedProperties = [];
    this.alreadyExtendedProperties = [];
    this.previewProperties = [];
    this.extensionServices = [];
    this.servicesGroups = [];
    this.dataSource = [];
    this.categorySuggestions = [];

    // get the reconciliation services
    this.reconciliationServicesMapSubscription = this.enrichmentService.reconciliationServicesMapSource
      .subscribe((serviceMap) => {
        this.reconciliationServicesMap = serviceMap;
      });

    this.transformationSubscription =
      this.transformationSvc.transformationObjSource.subscribe((transformationObj) => {
        this.transformationObj = transformationObj;
        this.currentAnnotation = this.transformationObj.getColumnAnnotations(this.header)[0];

      });

    this.kgServicesSubscription = this.getKGServices().subscribe((data: ConciliatorService[]) => {
      this.kgServices = data;
    });

    this.filters = new FormArray([]);
    this.group = new FormGroup({
      filters: this.filters
    });
    this.propertiesID = ['identifier',
      'name.text',
      'startDate',
      'endDate',
      'category.identifier',
      'product.identifier',
      'product.gtin13',
      'product.description',
      'product.sku',
      'product.seller.identifier',
      'measure.priceChanged',
      'measure.priceChange',
      'measure.price'
    ];
    this.operators = ['==', '!=',
      '<', '<=',
      '>', '>=',
      'IN', 'NOT IN',
      'LIKE', 'NOT LIKE',
      '=~', '!~'];
    this.features = ['A', 'B', 'C'];
    this.countries = ['Germany', 'Italy', 'Spain'];

    this.propertiesValue = this.enrichmentService.headers;
    this.dataSource = new MatTableDataSource();
    this.defaultFilter.propertyValue = this.header;

    this.reset();

    if (this.isColDate) {
      this.extensionServices.push(new ConciliatorService({ 'id': 'ecmwf', 'name': 'ECMWF', group: 'weather' }));
      this.extensionServices.push(new ConciliatorService({ 'id': 'er', 'name': 'EventRegistry', group: 'events' }));
      this.extensionServices.push(new ConciliatorService({ 'id': 'ide', 'name': 'Custom Event ID', group: 'events' }));
      this.extensionServices.push(new ConciliatorService({ 'id': 'ma', 'name': 'Media Attention', group: 'events' }));
      // this.reconciledFromService = new ConciliatorService({
      //   'id': 'geonames',
      //   'name': 'GeoNames',
      //   group: 'geo',
      //   identifierSpace: 'http://sws.geonames.org/',
      //   schemaSpace: 'http://www.geonames.org/ontology#'
      // });
    } else if (this.isColKeyword) {
      this.extensionServices.push(new ConciliatorService({ 'id': 'keywordscategories', 'name': 'Keyword to Categories', group: 'keywords' }));
    } else if (this.isColEvent) {
      this.extensionServices.push(new ConciliatorService({ 'id': 'ce', 'name': 'CustomEvent', group: 'events' }));
    } else if (this.dialogInputData.reconciliationServiceId) {
      this.reconciledFromService = this.reconciliationServicesMap.get(this.dialogInputData.reconciliationServiceId);
      if (this.reconciledFromService) {
        this.extensionServices.push(this.reconciledFromService);
        if (this.reconciledFromService.getId() === 'geonames') {
          this.isGeonamesColumn = true;
          this.extensionServices.push(new ConciliatorService({ 'id': 'ecmwf', 'name': 'ECMWF', group: 'weather' }));
          this.extensionServices.push(new ConciliatorService({ 'id': 'er', 'name': 'EventRegistry', group: 'events' }));
        } else if (this.reconciledFromService.getId() === 'productsservices') {
          this.isCategoriesColumn = true;
          this.extensionServices.push(new ConciliatorService({ 'id': 'er', 'name': 'EventRegistry', group: 'events' }));
        }
      }
      this.extensionServices.push(new ConciliatorService({ 'id': 'sameas', 'name': 'SameAs', group: 'sameas' }));
    }

    this.eventProperties = this.propertiesID;

    this.weatherOffsets = [0, 1, 2, 3, 4, 5, 6, 7];
    this.weatherParametersDescriptions = {
      '10u': '10 metre U wind component',
      '10v': '10 metre V wind component',
      '2d': '2 metre dewpoint temperature',
      '2t': '2 metre temperature',
      'rh': 'Relative humidity',
      'sd': 'Snow depth',
      'sf': 'Snowfall',
      'sp': 'Surface pressure',
      'ssr': 'Surface net solar radiation',
      'sund': 'Sunshine duration',
      'tcc': 'Total cloud cover',
      'tp': 'Total precipitation',
      'vis': 'Visibility',
      'ws': 'Wind speed'
    };
    this.weatherParameters = Object.keys(this.weatherParametersDescriptions);
    this.weatherAggregators = ['avg', 'min', 'max', 'cumul'];

    this.dateOperators = ['equal', 'before', 'after'];

  } // end ngOnInit

  checkIfSupportedSameAsExtension(): boolean {
    // annotation needs to be in place and needs to be a URI node annotation
    if (!this.currentAnnotation || this.currentAnnotation instanceof transformationDataModel.LiteralNodeAnnotation) {
      return false;
    }

    // the prefix should correspond to one of the supported services' identifier spaces
    let annotationPrefixUri = this.transformationObj.getURIForPrefix(this.currentAnnotation.urifyPrefix);
    let sourceKgService = this.kgServices.find(kgService => kgService.getIdentifierSpace() === annotationPrefixUri);
    if (sourceKgService) {
      return true;
    } else {
      return false;
    }
  }

  ngOnDestroy() {
    this.transformationSubscription.unsubscribe();
    this.reconciliationServicesMapSubscription.unsubscribe();
    this.kgServicesSubscription.unsubscribe();
  }

  getExtensionName(extensionObject) {
    if (extensionObject) {
      if (extensionObject instanceof transformationDataModel.ECMWFWeatherExtension) {
        return '(ECMWF) ' + extensionObject.derivedColumns.toString();
      } else if (extensionObject instanceof transformationDataModel.SameAsExtension) {
        return '(SameAs) ' + extensionObject.derivedColumns.toString();
      } else if (extensionObject instanceof transformationDataModel.EventExtension) {
        return '(ER) ' + extensionObject.derivedColumns.toString();
      } else if (extensionObject instanceof transformationDataModel.ReconciliationServiceExtension) {
        return '(KB) ' + extensionObject.derivedColumns.toString();
      } else if (extensionObject instanceof transformationDataModel.KeywordsCategoriesExtension) {
        return '(KC) ' + extensionObject.derivedColumns.toString();
      } else if (extensionObject instanceof transformationDataModel.CustomEventExtension) {
        return '(CE) ' + extensionObject.derivedColumns.toString();
      } else if (extensionObject instanceof transformationDataModel.CustomEventIDExtension) {
        return '(CEID) ' + extensionObject.derivedColumns.toString();
      } else if (extensionObject instanceof transformationDataModel.MediaAttentionExtension) {
        return '(MA) ' + extensionObject.derivedColumns.toString();
      } else {
        return 'Unknown extension';
      }
    } else {
      return '<Error loading extension object>';
    }

  }

  changeEditOrCreateNewRadio() {
    this.resetVariables();
    if (this.editOrCreateNew === 'create-new') {
      this.currentExtension = null;
      this.showPreview = false;
      this.selectedProperties = [];
      this.selectedServiceId = '';
    } else if (this.editOrCreateNew === 'edit-existing') {
      this.selectedServiceId = '';
      // not sure if necessary - TODO probably enable/disable the editing buttons
      if (!isNaN(Number.parseInt(this.selectedExtension))) {
        this.currentExtension = this.currentAnnotation.extensions[Number.parseInt(this.selectedExtension)];
        this.changeCurrentExtension();
      }
    } else {
      throw new Error(('unknown enrichment editor mode!'));
    }
  }

  changeCurrentExtension() {
    this.currentExtension = this.currentAnnotation.extensions[Number.parseInt(this.selectedExtension)];

    if (this.currentExtension instanceof transformationDataModel.ReconciliationServiceExtension) {
      this.selectedServiceId = this.currentExtension.reconciliationServiceId;
      this.selectedProperties = [];
      this.alreadyExtendedProperties = [];
      this.currentExtension.extensionProperties.forEach((propertyId) => {
        this.selectedProperties.push({
          id: propertyId,
          name: propertyId,
          display: propertyId,
          value: propertyId
        });
      });
      this.showPreview = true;
      this.fetchReconciliationServiceExtensions();
    } else if (this.currentExtension instanceof transformationDataModel.ECMWFWeatherExtension) {
      this.selectedServiceId = 'ecmwf';

      if (this.currentExtension.location instanceof transformationDataModel.WeatherExtensionLocationColumn) {
        if (!this.isGeonamesColumn) {
          this.placeChoice = 'fromCol';
          this.readPlacesFromCol = this.currentExtension.location.columnName;
        }
      } else if (this.currentExtension.location instanceof transformationDataModel.WeatherExtensionLocationString) {
        this.selectedPlace = this.currentExtension.location.locationString;
        this.placeChoice = 'placefromPicker';
      } else {
        throw new Error(('Error loading extension - unknown location option of ECMWF weather extension location.'));
      }

      if (this.currentExtension.date instanceof transformationDataModel.WeatherExtensionDateFromColumn) {
        // if the column for extension is not a date, then we use the column name
        if (!this.isColDate) {
          this.readDatesFromCol = this.currentExtension.date.columnName;
          this.dateChoice = 'fromCol';
        }
      } else if (this.currentExtension.date instanceof transformationDataModel.WeatherExtensionDateFromString) {
        this.selectedDate = this.currentExtension.date.dateString;
        this.dateChoice = 'fromPicker';
      } else {
        throw new Error(('Error loading extension - unknown location option of ECMWF weather extension date.'));
      }

      this.selectedWeatherParameters = this.currentExtension.weatherFeatures;
      this.selectedWeatherAggregators = this.currentExtension.aggregations;
      this.selectedWeatherOffsets = this.currentExtension.offsetDays;
      this.fetchWeatherData();
    } else if (this.currentExtension instanceof transformationDataModel.SameAsExtension) {
      this.selectedServiceId = 'sameas';
      this.selectedKGService = this.currentExtension.targetKnowledgeBase;
      this.fetchSameAsData();
    } else if (this.currentExtension instanceof transformationDataModel.EventExtension) {
      this.selectedServiceId = 'er';
    } else if (this.currentExtension instanceof transformationDataModel.KeywordsCategoriesExtension) {
      this.selectedServiceId = 'keywordscategories';
    } else if (this.currentExtension instanceof transformationDataModel.CustomEventExtension) {
      this.selectedServiceId = 'ce';
    } else if (this.currentExtension instanceof transformationDataModel.CustomEventIDExtension) {
      let parameters = this.currentExtension.parameters;
      if (parameters.length) {
        for (let i = 0; i < parameters.length; ++i) {
          // first filter contains start date and is compulsory
          this.addRow(new CustomEventFilterModel(parameters[i].property, parameters[i].operator, parameters[i].value), i === 0);
        }
        this.removeRow(0); // remove the first row - it will be replaced with the one from the saved extension
      }
      this.selectedServiceId = 'ide';
      this.fetchCustomEventIDsData();
    } else if (this.currentExtension instanceof transformationDataModel.MediaAttentionExtension) {
      this.selectedServiceId = 'ma';
    } else {
      this.selectedServiceId = '';
    }

  }

  public reset() {
    if (this.filters == null) {
      return;
    }

    let i = 0;
    while (this.filters.length !== 0) {
      i++;
      this.filters.removeAt(0);
    }

    this.filters.reset();

    if (this.hasDefaultFilter) {
      this.addRow(this.defaultFilter, true);
    } else {

      this.addRow();
    }
  }

  public removeRow(index: number) {

    this.filters.removeAt(index);

    if (index === 0 && this.filters.length === 0) {
      this.addRow();
    }

    this.dateExtensionDataSource = new MatTableDataSource(this.filters.controls);
  }

  private emptyRow(): CustomEventFilterModel {
    return {
      propertyId: null,
      operator: null,
      propertyValue: null
    };
  }

  public addRow(data?: CustomEventFilterModel, readonly: boolean = false) {
    data = (data != null) ? data : this.emptyRow();

    const filterGroup = new FormGroup({
      readonly: new FormControl(readonly),
      propertyId: new FormControl(data.propertyId, Validators.required),
      operator: new FormControl(data.operator, Validators.required),
      propertyValue: new FormControl(data.propertyValue, Validators.required)
    });

    this.filters.push(filterGroup);
    this.dateExtensionDataSource = new MatTableDataSource(this.filters.controls);
  }

  private get hasDefaultFilter(): boolean {
    return (Object.keys(this.defaultFilter).length > 0);
  }

  // Stub: send list of observable to template
  getKGServices = (): Observable<Object> => {
    const kgServices = [
      new ConciliatorService({ 'id': 'lau', 'name': 'LAU', 'identifierSpace': 'http://data.businessgraph.io/lau/' }),
      new ConciliatorService({ 'id': 'dbpedia', 'name': 'DBpedia', 'identifierSpace': 'http://dbpedia.org/resource/' }),
      new ConciliatorService({ 'id': 'wikidata', 'name': 'Wikidata', 'identifierSpace': 'http://www.wikidata.org/entity/' }),
      new ConciliatorService({ 'id': 'geonames', 'name': 'GeoNames', 'identifierSpace': 'http://sws.geonames.org/' })
    ];
    return Observable.of(kgServices);
  }

  private getSelectedService(): ConciliatorService {
    for (let i = 0; i < this.extensionServices.length; ++i) {
      if (this.extensionServices[i].getId() === this.selectedServiceId) {
        return this.extensionServices[i];
      }
    }
    return null;
  }

  public fetchReconciliationServiceExtensions() {
    this.dataLoading = true;
    this.showPreview = true;

    this.extendOnCols = []; // KB-based extension is always based on a single column - no additional cols
    const properties = this.selectedProperties
      .filter(prop => !this.alreadyExtendedProperties.includes(prop.value))
      .map(prop => prop.value);
    if (properties.length > 0) {
      this.enrichmentService.extendColumn(this.header, properties, this.getSelectedService()).subscribe((data) => {
        if (this.extensionData.length > 0) { // join data
          data['ext'].forEach((ext: Extension) => {
            this.extensionData.find((extension: Extension) => extension.key.toString() === ext.key.toString()).addProperties(ext.properties);
          });
        } else {
          this.extensionData = data['ext']; // overwrite
        }
        const propSet = new Set([...this.alreadyExtendedProperties, ...properties]);
        this.alreadyExtendedProperties = Array.from(propSet);
        // TODO this is exactly the same as the properties variable?
        this.previewProperties = this.selectedProperties
          .filter(prop => this.alreadyExtendedProperties.includes(prop.value))
          .map(prop => prop.value);

        data['props'].forEach((propDesc: Property) => {
          this.propertyDescriptions.set(propDesc.id, propDesc);
        });

        this.dataLoading = false;
      });
    } else {
      this.dataLoading = false;
    }
  }

  public fetchWeatherData() {
    this.dataLoading = true;
    this.showPreview = true;

    this.extendOnCols = [];

    const wcObj = {
      parameters: this.selectedWeatherParameters,
      aggregators: this.selectedWeatherAggregators,
      offsets: this.selectedWeatherOffsets
    };

    let dateConfig = {};
    let placeConfig = {};

    if (this.isColDate) {
      dateConfig = { readDatesFromCol: this.header };
    } else if (this.dateChoice === 'fromCol') {
      dateConfig = { readDatesFromCol: this.readDatesFromCol };
      this.extendOnCols.push(this.readDatesFromCol); // weather extension is based also on the column "date"
    } else {
      dateConfig = { date: this.selectedDate };
    }

    if (this.isGeonamesColumn) {
      placeConfig = { readPlacesFromCol: this.header };
    } else if (this.placeChoice === 'fromCol') {
      placeConfig = { readPlacesFromCol: this.readPlacesFromCol };
      this.extendOnCols.push(this.readPlacesFromCol); // weather extension is based also on the column "place"
    } else {
      placeConfig = { place: this.selectedPlace };
    }

    const weatherConfig = new WeatherConfigurator({ ...wcObj, ...dateConfig, ...placeConfig });
    const basedOn = this.isColDate ? 'date' : 'place';

    this.enrichmentService.weatherData(basedOn, weatherConfig).subscribe((data: Extension[]) => {
      this.extensionData = data;
      if (this.extensionData.length > 0) {
        this.previewProperties = Array.from(this.extensionData[0].properties.keys());
      }
      this.dataLoading = false;
    });

  }

  public fetchCategoriesForKeyword() {
    this.dataLoading = true;
    this.showPreview = true;

    this.extendOnCols = []; // keywordtocategories extension is always based on a single column - no additional cols

    // pass parameters to enrichment service through Extension object
    this.enrichmentService.keywordsToCategoriesData(this.header).subscribe((data) => {
      this.extensionData = data;
      if (this.extensionData.length > 0) {
        this.previewProperties = Array.from(this.extensionData[0].properties.keys());
      }
      this.dataLoading = false;
    });
  }

  public fetchSameAsData() {
    // set data loading and showpreview
    this.dataLoading = true;
    this.showPreview = true;

    this.extendOnCols = []; // sameas extension is always based on a single column - no additional cols

    // get KB source and KB target parameters
    this.sameAsSource = this.reconciliationServicesMap.get(this.dialogInputData.reconciliationServiceId);

    if (!this.sameAsSource) {
      // sameAs extension source not one of the reconciliation services - try the KG services
      this.sameAsSource = this.kgServices.find(source => source.getId() === this.dialogInputData.reconciliationServiceId);
      if (!this.sameAsSource) {
        // last resort - if the annotation is a 'sameAs' - use the extension's target knowledge base
        const extension = this.transformationObj.getExtensionOfDerivedColumn(this.header);
        if (extension) {
          if (extension instanceof transformationDataModel.SameAsExtension) {
            this.sameAsSource = this.kgServices.find(source => source.getId() === extension.targetKnowledgeBase);
          }
        }
      }
    }



    // check if we got a hit either from the reconciliation services or from the KG services
    if (this.sameAsSource) {
      // const sameAsSource = this.enrichmentService.getReconciliationServiceOfColumn(this.header);
      this.reconciledToService = this.kgServices.find((svc: ConciliatorService) => svc.getId() === this.selectedKGService);

      // pass parameters to enrichment service through Extension object
      this.enrichmentService.sameasData(this.header, this.sameAsSource, this.reconciledToService).subscribe((data) => {
        this.extensionData = data;
        if (this.extensionData.length > 0) {
          this.previewProperties = Array.from(this.extensionData[0].properties.keys());
        }
        this.dataLoading = false;
      });
    } else {
      // TODO - what if we did not find any source??
    }

  }

  fetchEREventsData() {
    this.dataLoading = true;
    this.showPreview = true;

    this.extendOnCols = [];

    let dateConfig = {};
    let placeConfig = {};
    let categoryConfig = {};

    if (this.isColDate) {
      dateConfig = { readDatesFromCol: this.header };
    } else if (this.dateChoice === 'fromCol') {
      dateConfig = { readDatesFromCol: this.readDatesFromCol };
      // this.extendOnCols.push(this.readDatesFromCol); // event extension is based also on the column "date" TODO: multi-col ext
    } else {
      dateConfig = { date: this.selectedDate };
    }

    if (this.isGeonamesColumn) {
      placeConfig = { readPlacesFromCol: this.header };
    } else if (this.placeChoice === 'fromCol') {
      placeConfig = { readPlacesFromCol: this.readPlacesFromCol };
      // this.extendOnCols.push(this.readPlacesFromCol); // event extension is based also on the column "place" TODO: multi-col ext
    } else {
      placeConfig = { places: this.selectedChipsPlaces };
    }

    if (this.isCategoriesColumn) {
      categoryConfig = { readCategoriesFromCol: this.header };
    } else if (this.categoryChoice === 'fromCol') {
      categoryConfig = { readCategoriesFromCol: this.readCategoriesFromCol };
      // this.extendOnCols.push(this.readPlacesFromCol); // event extension is based also on the column "category" TODO: multi-col ext
    } else {
      categoryConfig = { categories: this.selectedChipsCategories };
    }

    const eventConfig = new EventConfigurator({ ...dateConfig, ...placeConfig, ...categoryConfig });
    const basedOn = this.isColDate ? 'date' : this.isGeonamesColumn ? 'place' : this.isCategoriesColumn ? 'category' : null;

    this.enrichmentService.eventData(basedOn, eventConfig).subscribe((data: Extension[]) => {
      this.extensionData = data;
      if (this.extensionData.length > 0) {
        this.previewProperties = Array.from(this.extensionData[0].properties.keys());
      }
      this.dataLoading = false;
    });
  }

  public fetchCustomEventIDsData() {
    this.dataLoading = true;
    this.showPreview = true;

    let query = [];
    const queries = [];
    const allDates = this.enrichmentService.data.map(row => [row[':' + this.header]]);

    const cols = [];
    let key = [];
    const keys = [];

    this.extendOnCols = [];
    allDates.forEach((date_in_row, index) => {
      query = [];
      key = [];
      this.filters.value.forEach((element, id) => {
        const isColumn = this.enrichmentService.headers.indexOf(element['propertyValue']) > -1;
        let value;
        if (isColumn) {
          value = this.enrichmentService.data.map(row => [row[':' + element['propertyValue']]])[index][0];

          if (cols.indexOf(element['propertyValue']) < 0) {
            cols.push(element['propertyValue']);
            if (element['propertyValue'] !== this.header) {
              this.extendOnCols.push(element['propertyValue']);
            }
          }
          key.push(value); // push the value only if it is needed for deriving the new column!
        } else {
          value = element['propertyValue'];

        }
        query.push({
          'propertyID': element['propertyId'],
          'operator': element['operator'],
          'value': value,
          'isColumn': isColumn
        });
      });
      keys.push(key);
      queries.push({ 'key': key, 'filters': query });
    });

    const basedOn = this.isColDate ? 'date' : 'place';

    this.enrichmentService.customEventIDData(basedOn, queries, cols).subscribe((httpResult: Extension[]) => {
      this.extensionData = httpResult;
      if (this.extensionData.length > 0) {
        this.previewProperties = Array.from(this.extensionData[0].properties.keys());
      }
      this.dataLoading = false;
    });
  }

  isColNameAvailable(colName): boolean {
    return !this.enrichmentService.headers.find((headerName) => {
      return headerName === colName;
    });
  }

  isValidUrl(string): boolean {
    try {
      const url = new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  getExtensionMatchPairs(): Array<any> {
    // generate match pairs
    const extensionMatchPairs = [];
    for (let i = 0; i < this.extensionData.length; ++i) {
      let valuesToMatch = this.extensionData[i].key;
      if (!(valuesToMatch instanceof Array)) {
        valuesToMatch = [valuesToMatch];
      }
      if (this.selectedServiceId === 'ecmwf') {
        if (!this.isColDate && this.extensionData[i].key.length === 2) {
          // the ECMWF extension service returns the key in different order based on what is the base column type (?!)
          // this hack reverses the key so we can generate the Clojure correctly later...
          valuesToMatch = [this.extensionData[i].key[1], this.extensionData[i].key[0]];
        }
      }

      const matches = [];
      Array.from(this.extensionData[i].properties.values()).forEach((match) => {
        if (match[0]) {
          if (match[0].id) {
            matches.push(match[0].id);
          }
          if (match[0].str) {
            matches.push(match[0].str);
          }
        }
      });
      extensionMatchPairs.push(new transformationDataModel.MatchPair(valuesToMatch, matches));
    }
    return extensionMatchPairs;
  }

  applyExtension() {
    const derivedColumnNames = [];

    this.previewProperties.forEach((prop: string) => {

      // const propDescr = this.propertyDescriptions.has(prop) && this.propertyDescriptions.get(prop) || null;
      // const propType = propDescr ? propDescr.type : null;

      // Column name can be a URI -> clean it and get the suffix
      let newColName = `${this.header}_`;
      if (prop.startsWith('http')) {
        newColName += prop.replace(UrlUtils.getNamespaceFromURL(new URL(prop)), '');
      } else if (prop.startsWith('WF')) { // do not concatenate weather column names
        newColName = prop;
      } else {
        newColName += prop;
      }

      let tmpColName = newColName;
      // if we are creating a new extension we need to check if the column name is available
      if (!this.currentExtension) {
        let postfixNum = 1;
        while (!this.isColNameAvailable(tmpColName)) {
          tmpColName = newColName + '_' + postfixNum;
          postfixNum++;
        }
        newColName = tmpColName;
      } else {
        // if we are editing the current extension, we need to check if the new column name is one of the names from the already derived columns
        if (this.currentExtension.derivedColumns.find((derivedColName) => {
          return derivedColName === newColName;
        })) {
          // it is one of the derived column names! nothing to do here
        } else {
          // it is not one of the derived column names; check if it is available
          let postfixNum = 1;
          while (!this.isColNameAvailable(tmpColName)) {
            tmpColName = newColName + '_' + postfixNum;
            postfixNum++;
          }
          newColName = tmpColName;
        }
      }

      derivedColumnNames.push(newColName);
    });

    // generate match pairs
    const extensionMatchPairs = this.getExtensionMatchPairs();

    // we keep existing ID of extension if it exists or create a unique one
    let extensionId = 0;
    if (this.currentExtension) {
      extensionId = this.currentExtension.id || this.transformationObj.getUniqueId();
    } else {
      extensionId = this.transformationObj.getUniqueId();
    }
    if (!this.reconciledFromService) {
      if (this.sameAsSource) {
        this.reconciledFromService = this.sameAsSource;
      } else {
        // TODO need a better solution for this!
        this.reconciledFromService = new ConciliatorService({ 'id': 'nonexistantservice', 'name': 'nonexistantservice', 'identifierSpace': 'nonexistantservice' });
      }
    }
    if (this.selectedServiceId === this.reconciledFromService.getId()) {
      // Extension is from the same service that we reconciled the column with
      this.currentExtension = new transformationDataModel.ReconciliationServiceExtension(derivedColumnNames, extensionMatchPairs, extensionId, this.currentAnnotation.conciliatorServiceName, this.previewProperties);
      let i;
      for (i = 0; i < derivedColumnNames.length; ++i) {
        const colName = derivedColumnNames[i];
        // get corresponding property name
        const propertyName = this.previewProperties[i];
        const propertyDescription = this.propertyDescriptions.get(propertyName);

        let propertyFullyQualifiedName = propertyName;
        // if the property name is not a valid URI, we need to prefix it with the schema string of the reconciliation service
        if (!this.isValidUrl(propertyName)) {
          propertyFullyQualifiedName = this.reconciledFromService.getSchemaSpace() + propertyName;
        }
        const propertyTDMObject = new transformationDataModel.Property('', propertyFullyQualifiedName, [], []);

        // if the column has already been annotated (this could happen when editing an existing extension)
        // we use the ID of the existing annotation; otherwise we create a unique ID
        const existingAnnotation = this.transformationObj.getColumnAnnotations(colName)[0];
        const annotationId = existingAnnotation ? existingAnnotation.id : this.transformationObj.getUniqueId();

        // check the 'type' attribute to determine whether the value of the property is a URI node or literal node
        if (propertyDescription.type) {
          // Type is not null for URI nodes
          const newAnnotationType = new transformationDataModel.ConstantURI(
            this.annotationService.getPrefixForNamespace(this.reconciledFromService.getSchemaSpace(), this.transformationObj), // prefix
            propertyDescription.type.id // namespace
            , [], []);
          const newAnnotation = new transformationDataModel.URINodeAnnotation(
            colName,
            this.currentAnnotation.id,
            [propertyTDMObject], // props
            [newAnnotationType], // types
            this.annotationService.getPrefixForNamespace(this.reconciledFromService.getIdentifierSpace(), this.transformationObj),
            false,
            'valid',
            annotationId,
            '',
            [],
            null
          );
          this.transformationObj.addOrReplaceAnnotation(newAnnotation);
        } else {
          // literal annotation
          const newAnnotation = new transformationDataModel.LiteralNodeAnnotation(
            colName,
            this.currentAnnotation.id, // subject annotation ID
            [propertyTDMObject], // properties
            'http://www.w3.org/2001/XMLSchema#string', // datatype assumed to be string
            'en', // lang tag
            'valid', // status
            annotationId, // id
            []
          );
          this.transformationObj.addOrReplaceAnnotation(newAnnotation);
        }
        // we have added object annotations
        this.currentAnnotation.isSubject = true;

        // just in case it was marked with 'warning', we set the status to 'valid'
        this.currentAnnotation.status = 'valid';

      }
    } else {
      let extensionMatchPairs = this.getExtensionMatchPairs();
      // One of the extension services has been used
      switch (this.selectedServiceId) {
        case 'geonames':
        // date column (can't extend using non-dates or non-reconciled cols)
        case 'er':
          break;
        case 'sameas':
          let annotationPrefixUri = this.transformationObj.getURIForPrefix(this.currentAnnotation.urifyPrefix);
          let sourceKgService;
          if (this.sameAsSource) {
            sourceKgService = this.sameAsSource;
          } else {
            sourceKgService = this.kgServices.find(kgService => kgService.getIdentifierSpace() === annotationPrefixUri);
          }

          let targetKgService = this.kgServices.find(kgService => kgService.getId() === this.selectedKGService);
          if (sourceKgService) {
            this.currentExtension = new transformationDataModel.SameAsExtension(derivedColumnNames, extensionMatchPairs,
              extensionId, sourceKgService.getId(), this.selectedKGService);
          } else {
            throw ("Unknown source knowledge graph for sameAs extension");
          }

          // create the annotation of the new column
          let propertyTDMObject = new transformationDataModel.Property('', 'http://www.w3.org/2002/07/owl#sameAs', [], []);
          // if the column has already been annotated (this could happen when editing an existing extension)
          // we use the ID of the existing annotation; otherwise we create a unique ID
          let existingAnnotation = this.transformationObj.getColumnAnnotations(derivedColumnNames[0])[0];
          let annotationId = existingAnnotation ? existingAnnotation.id : this.transformationObj.getUniqueId();

          let newAnnotation = new transformationDataModel.URINodeAnnotation(
            derivedColumnNames[0],
            this.currentAnnotation.id,
            [propertyTDMObject], // props
            [], // types
            this.annotationService.getPrefixForNamespace(targetKgService.getIdentifierSpace(), this.transformationObj),
            false,
            transformationDataModel.AnnotationStatus.invalid,
            annotationId,
            '',
            [],
            null
          );
          this.transformationObj.addOrReplaceAnnotation(newAnnotation);

          break;
        case 'keywordscategories':
          this.currentExtension = new transformationDataModel.KeywordsCategoriesExtension(derivedColumnNames, extensionMatchPairs, extensionId);
          break;
        case 'ma':
        case 'ide':
          let customEventParams = [];
          // get parameters
          this.filters.value.forEach((element, id) => {
            const isColumn = this.enrichmentService.headers.indexOf(element['propertyValue']) > -1;
            let param = new transformationDataModel.CustomEventIDExtensionParameter(element.propertyId, element.operator, element.propertyValue, isColumn);
            customEventParams.push(param);
          });

          this.currentExtension = new transformationDataModel.CustomEventIDExtension(derivedColumnNames, extensionMatchPairs, extensionId, customEventParams);

          newAnnotation = new transformationDataModel.URINodeAnnotation(
            derivedColumnNames[0],
            0,
            [],
            [],
            '',
            false,
            transformationDataModel.AnnotationStatus.invalid,
            this.transformationObj.getUniqueId(),
            '',
            [],
            null
          );

          this.transformationObj.addOrReplaceAnnotation(newAnnotation);
          break;
        case 'ce':

          break;
        case 'ecmwf':
          let weatherExtensionDate = new transformationDataModel.WeatherExtensionDate();
          if (this.isColDate) {
            weatherExtensionDate = new transformationDataModel.WeatherExtensionDateFromColumn(this.header);
          } else if (this.dateChoice === 'fromCol') {
            weatherExtensionDate = new transformationDataModel.WeatherExtensionDateFromColumn(this.readDatesFromCol);
          } else {
            weatherExtensionDate = new transformationDataModel.WeatherExtensionDateFromString(this.selectedDate);
          }

          let weatherExtensionLocation = new transformationDataModel.WeatherExtensionLocation();
          if (this.isGeonamesColumn) {
            weatherExtensionLocation = new transformationDataModel.WeatherExtensionLocationColumn(this.header);
          } else if (this.placeChoice === 'fromCol') {
            weatherExtensionLocation = new transformationDataModel.WeatherExtensionLocationColumn(this.readPlacesFromCol);
          } else {
            weatherExtensionLocation = new transformationDataModel.WeatherExtensionLocationString(this.selectedDate);
          }

          this.currentExtension = new transformationDataModel.ECMWFWeatherExtension(
            derivedColumnNames,
            extensionMatchPairs,
            extensionId,
            weatherExtensionLocation,
            weatherExtensionDate,
            this.selectedWeatherParameters,
            this.selectedWeatherOffsets,
            this.selectedWeatherAggregators
          );
          break;
        default:
          throw new Error(('Could not identify the type of extension'));
      }
    }

    // add extension to current annotation and update the transformation
    this.transformationObj.addOrReplaceExtension(this.currentAnnotation, this.currentExtension);
    this.transformationObj.addOrReplaceAnnotation(this.currentAnnotation);
    this.transformationSvc.transformationObjSource.next(this.transformationObj);
    this.transformationSvc.previewedTransformationObjSource.next(this.transformationObj);
    this.dialogRef.close();
  }

  public fetchCustomEventsData() {
    this.dataLoading = true;
    this.showPreview = true;

    const props = this.selectedEventProperties;
    const allEventIds = this.enrichmentService.data.map(row => row[':' + this.header]);
    const distinctArray = allEventIds.filter((n, i) => allEventIds.indexOf(n) === i);
    const basedOn = this.isColDate ? 'date' : 'place';

    this.enrichmentService.customEvents(basedOn, distinctArray, props).subscribe((httpResult: Extension[]) => {
      this.extensionData = httpResult;
      if (this.extensionData.length > 0) {
        this.previewProperties = Array.from(this.extensionData[0].properties.keys());
      }
      this.dataLoading = false;
    });
  }

  // TODO: stub method
  public fetchMediaAttentionData() {
    this.dataLoading = false;
    return [];
  }

  public extensionProperties = (): Observable<Response> => {
    return this.enrichmentService.propertiesAvailable(this.reconciledFromService);
  }

  public removePropertyFromPreview(property: string) {
    this.previewProperties = this.previewProperties.filter(prop => prop !== property);
  }

  public addPropertyToPreview(property: string) {
    if (this.alreadyExtendedProperties.includes(property)) {
      this.previewProperties.push(property);
    }
  }

  // changeDateColumn(placeColValue) {
  //   this.readDatesFromCol = placeColValue;
  // }
  //
  // changePlaceColumn(dateColValue) {
  //   this.readPlacesFromCol = dateColValue;
  //
  // }
  //
  // setManualPlace(row) {
  //
  //   this.selectedPlace = this.dataSource[row].geonameId;
  //   this.dataSource = [];
  // }
  //
  // private propertyWithReconciledValues(prop): boolean {
  //   let valid = true;
  //   this.extensionData.forEach((extension: Extension) => {
  //     const objects = extension.properties.get(prop);
  //     if (objects && objects.length !== extension.properties.get(prop).filter(obj => {
  //       return !(obj && !obj['id']);
  //     }).length) {
  //       valid = false;
  //     }
  //   });
  //   return valid;
  // }


  geoSuggestions(new_val) {
    this.enrichmentService.geoNamesAutocomplete(this.selectedPlace).subscribe(data => {
      this.dataSource = data;
    });
  }

  categoriesSuggestions(new_val) {
    this.enrichmentService.googleCategoriesAutocomplete(this.selectedCategory).subscribe(data => {
      this.categorySuggestions = data;
    });
  }

  public _filter(value: string) {
    this.geoAllowedSources = [];
    const filterValue = value.toLowerCase();

    for (let i = 0; i < this.geoSources.length; i++) {
      if (this.geoSources[i].toLowerCase().search(filterValue) !== -1) {
        this.geoAllowedSources.push(this.geoSources[i]);
      }
    }
  }

  public _filterCategories(value: string) {
    this.categoriesAllowedSources = [];
    const filterValue = value.toLowerCase();

    for (let i = 0; i < this.categoriesSources.length; i++) {
      if (this.categoriesSources[i].toLowerCase().search(filterValue) !== -1) {
        this.categoriesAllowedSources.push(this.categoriesSources[i]);
      }
    }

  }

  public _filterDates(value: string) {

    const filterValue = value.toLowerCase();
    if (value !== '') {
      this.allowedSources = this.enrichmentService.headers.filter(h => h.toLowerCase().search(filterValue) !== -1);
    } else {
      this.allowedSources = this.enrichmentService.headers.filter(h => h !== this.header);
    }
  }

  addPlaceChips(geoId: string): void {
    this.selectedChipsPlaces.push(geoId);
    this.inputPLaceChips.nativeElement.value = '';

  }

  removePlaceChips(place: string): void {
    const index = this.selectedChipsPlaces.indexOf(place);

    if (index >= 0) {
      this.selectedChipsPlaces.splice(index, 1);
    }
  }

  addCategoriesChips(categoryId: string): void {
    this.selectedChipsCategories.push(categoryId);
    this.inputCategoriesChips.nativeElement.value = '';

  }

  removeCategoriesChips(categories: string): void {
    const index = this.selectedChipsCategories.indexOf(categories);

    if (index >= 0) {
      this.selectedChipsCategories.splice(index, 1);
    }
  }

  resetVariables() {
    this.placeChoice = '';
    this.dateChoice = '';
    this.categoryChoice = '';

    this.selectedDate = '';
    this.selectedPlace = '';
    this.selectedCategory = '';

    this.readDatesFromCol = '';
    this.readPlacesFromCol = '';
    this.readCategoriesFromCol = '';

    this.selectedWeatherAggregators = [];
    this.selectedWeatherOffsets = [];
    this.selectedWeatherParameters = [];

    this.dataSource = [];
    this.geoAllowedSources = this.geoSources;
    this.allowedSources = this.enrichmentService.headers.filter(h => h !== this.header);

  }

  removeCurrentExtension() {
    if (confirm('Are you sure you want to delete this extension?')) {
      this.transformationObj.removeExtensionById(this.currentExtension.id);
      this.transformationSvc.transformationObjSource.next(this.transformationObj);
      this.transformationSvc.previewedTransformationObjSource.next(this.transformationObj);
    }
  }
}
