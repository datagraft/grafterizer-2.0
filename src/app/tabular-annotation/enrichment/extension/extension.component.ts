import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
// import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { EnrichmentService} from '../enrichment.service';
import { ConciliatorService, EventConfigurator, Extension, ExtensionDeriveMap, Property, WeatherConfigurator } from '../enrichment.model';
import { HttpClient } from '@angular/common/http';
import { UrlUtils } from '../../shared/url-utils';
import { Observable } from 'rxjs';

// Manuel
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatTable, MatTableDataSource } from '@angular/material';
import { Keys } from '@swimlane/ngx-datatable/release/utils';
import * as moment from 'moment';

// Manuel
export class CustomEventFilerModel {
  propertyId?: string;
  operator?: string;
  propertyValue?: string;
}
// END Manuel

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
  public displayedColumns: string[] = ['placeSuggestions'];
  public header: any;
  public previewHeader: any;
  public colIndex: any;
  public isColDate: boolean;
  public isColReconciled: boolean;
  public extensionData: any;
  public propertyDescriptions: Map<string, Property>;
  public services: ConciliatorService[];
  public showPreview: boolean;
  public selectedProperties: any[];
  public alreadyExtendedProperties: string[];
  public previewProperties: string[];
  public selectedService: string;
  public servicesGroups: string[];
  public allowedSources: string[];
  public geoAllowedSources: string[];
  public categoriesAllowedSources: string[];
  public geo_Sources: string[];
  public categories_Sources: string[];
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
  public reconciledFromService: ConciliatorService;
  public reconciledToService: ConciliatorService; // useful for sameAs extensions
  public shiftColumn = false;
  public selectedChipsPlaces: any = [];
  public selectedChipsCategories: any = [];
  
  public kgServices: ConciliatorService[];
  public extendOnCols: string[];
  
  //Manuel
  public selectedEventProperties: string[];
  public dateOperators: string[];
  public group : any;
  public filters: FormArray;
  public dateExtensionDisplayedColumns = ['propertyId', 'operator', 'propertyValue', 'actions'];
  public propertiesID: string[] = [];
  public operators: string[] = [];
  public propertiesValue : string[] = [];
  public defaultFilter: CustomEventFilerModel = {
    propertyId: 'startDate',
    operator: '==',
    propertyValue: this.header
  }; 
  public dateExtensionDataSource: MatTableDataSource<any> 
  public eventProperties : string[] = []
  public maStartDate : any;
  public maEndDate : any;
  public features : string[];
  public selectedFeatures: any;
  public countries : string[];
  public selectedCountry: any;



  @ViewChild('inputCategoriesChips') inputCategoriesChips: ElementRef<HTMLInputElement>;
  @ViewChild('inputPLaceChips') inputPLaceChips: ElementRef<HTMLInputElement>;

  constructor(public dialogRef: MatDialogRef<ExtensionComponent>,
    private http: HttpClient,
    @Inject(MAT_DIALOG_DATA) public dialogInputData: any,
    public enrichmentService: EnrichmentService) {
  }

  ngOnInit() {
    this.header = this.dialogInputData.header;
    this.previewHeader = this.header;
    this.geo_Sources = this.dialogInputData.geoSoources;
    this.geoAllowedSources = this.geo_Sources;
    this.categories_Sources = this.dialogInputData.categoriesSoources;
    this.categoriesAllowedSources = this.categories_Sources;
    this.colIndex = this.dialogInputData.indexCol;
    this.isColDate = this.dialogInputData.colDate;
    this.isColReconciled = this.dialogInputData.colReconciled;
    this.showPreview = false;
    this.dataLoading = false;
    this.extensionData = [];
    this.propertyDescriptions = new Map();
    this.allowedSources = this.enrichmentService.headers.filter(h => h !== this.header);
    this.selectedProperties = [];
    this.alreadyExtendedProperties = [];
    this.previewProperties = [];
    this.services = [];
    this.servicesGroups = [];
    this.dataSource = [];
    this.categorySuggestions = [];

    // Manuel
    this.filters = new FormArray([]);
    this.group = new FormGroup({
      filters: this.filters
    });
    this.propertiesID = [ 'identifier',
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
    this.operators = [ '==', '!=', 
       '<', '<=', 
    '>', '>=', 
    'IN', 'NOT IN', 
    'LIKE', 'NOT LIKE', 
    '=~', '!~' ];
    this.features = ['A', 'B', 'C']
    this.countries = ['Germany', 'Italy', 'Spain']

    this.propertiesValue = this.enrichmentService.headers;
    this.dataSource = new MatTableDataSource();
    this.defaultFilter.propertyValue = this.header;

    this.reset();

  

    // END Manuel
    if (this.isColDate) {
      this.services.push(new ConciliatorService({ 'id': 'ecmwf', 'name': 'ECMWF', group: 'weather' }));
      this.services.push(new ConciliatorService({ 'id': 'er', 'name': 'EventRegistry', group: 'events' }));
      this.services.push(new ConciliatorService({ 'id': 'ce', 'name': 'CustomEvent', group: 'events' }));
      this.services.push(new ConciliatorService({ 'id': 'ide', 'name': 'Event ID', group: 'events' }))
      this.services.push(new ConciliatorService({ 'id': 'ma', 'name': 'Media Attention', group: 'events' }))
      // this.reconciledFromService = new ConciliatorService({
      //   'id': 'geonames',
      //   'name': 'GeoNames',
      //   group: 'geo',
      //   identifierSpace: 'http://sws.geonames.org/',
      //   schemaSpace: 'http://www.geonames.org/ontology#'
      // });
    } else if (this.isColReconciled) {
      this.reconciledFromService = this.enrichmentService.getReconciliationServiceOfColumn(this.header);
      this.services.push(this.reconciledFromService);
      if (this.reconciledFromService.getId() === 'geonames') {
        this.isGeonamesColumn = true;
        this.services.push(new ConciliatorService({ 'id': 'ecmwf', 'name': 'ECMWF', group: 'weather' }));
        this.services.push(new ConciliatorService({ 'id': 'er', 'name': 'EventRegistry', group: 'events' }));
      } else if (this.reconciledFromService.getId() === 'productsservices') {
        this.isCategoriesColumn = true;
        this.services.push(new ConciliatorService({ 'id': 'er', 'name': 'EventRegistry', group: 'events' }));
      }
      this.services.push(new ConciliatorService({ 'id': 'sameas', 'name': 'SameAs', group: 'sameas' }));
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
    
    //Manuel
    this.dateOperators = ['equal', 'before', 'after']
    //END Manuel

    this.getKGServices().subscribe((data: ConciliatorService[]) => {
      this.kgServices = data;
    });
  } // end ngOnInit

  // Manuel
  public reset() {
    if (this.filters == null) { return; }

    let i = 0
    while (this.filters.length !== 0) {
      i++;
      this.filters.removeAt(0);
    }

    this.filters.reset();

    if (this.hasDefaultFilter) {
      this.addRow(this.defaultFilter, true);
    }
    else {

      this.addRow();
    }
  }

  public removeRow(index: number) {
    console.log('filters')
    console.log(this.filters.value)
    console.log(index)

    this.filters.removeAt(index);
    console.log(this.filters.value)

    if (index === 0 && this.filters.length === 0) {
      this.addRow();
    }

    this.dateExtensionDataSource = new MatTableDataSource(this.filters.controls);
  }

  private emptyRow(): CustomEventFilerModel {
    return {
      propertyId: null,
      operator: null,
      propertyValue: null
    };
  }
  
  public addRow(data?: CustomEventFilerModel, readonly: boolean = false) {
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
  
  //END MANUEL

  private get hasDefaultFilter(): boolean {
    return (Object.keys(this.defaultFilter).length > 0);
  }
  // END Manuel

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

  public extend() {
    this.dataLoading = true;
    this.showPreview = true;

    this.extendOnCols = []; // KB-based extension is always based on a single column - no additional cols

    const properties = this.selectedProperties
      .filter(prop => !this.alreadyExtendedProperties.includes(prop.value))
      .map(prop => prop.value);
    if (properties.length > 0) {
      this.enrichmentService.extendColumn(this.header, properties).subscribe((data) => {
        if (this.extensionData.length > 0) { // join data
          data['ext'].forEach((ext: Extension) => {
            this.extensionData.find((extension: Extension) => extension.key.toString() === ext.key.toString()).addProperties(ext.properties);
          });
        } else {
          this.extensionData = data['ext']; // overwrite
        }
        const propSet = new Set([...this.alreadyExtendedProperties, ...properties]);
        this.alreadyExtendedProperties = Array.from(propSet);
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

  public weather() {
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
      console.log('-----------ExtensionData-----------')
      console.log(data)

      this.extensionData = data;
      if (this.extensionData.length > 0) {
        this.previewProperties = Array.from(this.extensionData[0].properties.keys());
      }
      this.dataLoading = false;
      
      console.log('extensionData')
      console.log(this.extensionData)
      
      console.log('previewProperties')
      console.log(this.previewProperties)
    });
  
  }




  public sameas() {
    // set data loading and showpreview
    this.dataLoading = true;
    this.showPreview = true;

    this.extendOnCols = []; // sameas extension is always based on a single column - no additional cols

    // get KB source and KB target parameters
    const sameAsSource = this.enrichmentService.getReconciliationServiceOfColumn(this.header);
    this.reconciledToService = this.kgServices.find((svc: ConciliatorService) => svc.getId() === this.selectedKGService);

    // pass parameters to enrichment service through Extension object
    this.enrichmentService.sameasData(this.header, sameAsSource, this.reconciledToService).subscribe((data) => {
      this.extensionData = data;
      if (this.extensionData.length > 0) {
        this.previewProperties = Array.from(this.extensionData[0].properties.keys());
      }
      this.dataLoading = false;
    });
  }

  event() {
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
      console.log('----------data-----------')
      console.log(data)

      this.extensionData = data;
      if (this.extensionData.length > 0) {
        this.previewProperties = Array.from(this.extensionData[0].properties.keys());
      }
      this.dataLoading = false;
    });
  }

  // public castDate(date){
  //   return date.substring(0, 4) + '-' + date.substring(4, 6) + '-' + date.substring(6, 8)
  // }

  public customEventExtension(){
    this.dataLoading = true;
    this.showPreview = true;

    let payload = {};
    let query = [];
    let queries = [];
    let allDates = this.enrichmentService.data.map(row => [row[':' + this.header]]);
    

    let cols = [];
    let key = [];
    let keys = [];
    console.log('---filters---')
    console.log(this.filters.value)

    this.extendOnCols = [];
    // console.log('col evolution')
    allDates.forEach((date_in_row, index) => {  
      query = [];
      key = [];
      this.filters.value.forEach((element, id) => {
        // console.log('---- element ------' + id)
        // console.log(element)
        let isColumn = this.enrichmentService.headers.indexOf(element['propertyValue']) > -1; 
        let value;
        if (isColumn){
          value = this.enrichmentService.data.map(row => [row[':' + element['propertyValue']]])[index][0];
          
          if (cols.indexOf(element['propertyValue']) < 0){
            cols.push(element['propertyValue']);
            if (element['propertyValue'] != this.header){
              this.extendOnCols.push(element['propertyValue']);
            }
          }
        }else{
          value = element['propertyValue'];
        }

        key.push(value)
        // if (id == 0){
        //   value = moment(value).format()
        // }

        query.push({
          'propertyID': element['propertyId'],
          'operator' : element['operator'],
          'value' : value,
          'isColumn' : isColumn 
        });
      });
      keys.push(key)
      queries.push({'key' : key, 'filters' : query});
    });

    // payload = {'queries' : queries};

    const basedOn = this.isColDate ? 'date' : 'place';

    this.enrichmentService.customEventData(basedOn, queries, cols).subscribe((httpResult : Extension[]) => {      
      this.extensionData = httpResult;
      if (this.extensionData.length > 0) {
        this.previewProperties = Array.from(this.extensionData[0].properties.keys());
      }
      this.dataLoading = false;
    });
  }

  public submit() {
    const deriveMaps = [];

    this.previewProperties.forEach((prop: string) => {

      const propDescr = this.propertyDescriptions.has(prop) && this.propertyDescriptions.get(prop) || null;
      const propType = propDescr ? propDescr.type : null;

      // Column name can be a URI -> clean it and get the suffix
      let newColName = `${this.header}_`;
      if (prop.startsWith('http')) {
        newColName += prop.replace(UrlUtils.getNamespaceFromURL(new URL(prop)), '');
      } else if (prop.startsWith('WF')) { // do not concatenate weather column names
        newColName = prop;
      } else {
        newColName += prop;
      }

      deriveMaps.push(new ExtensionDeriveMap(newColName, this.extendOnCols, propDescr ? propDescr.id : null)
        .buildFromExtension(prop, this.extensionData, [propType].filter(p => p != null)));

    });
    
    this.dialogRef.close({
      'deriveMaps': deriveMaps,
      'conciliator': this.reconciledFromService,
      'conciliatorTo': this.reconciledToService,
      'shift': this.shiftColumn,
      'header': this.previewHeader,
      'indexCol': this.colIndex
    });
  }

  public EventIDExtension(){
    this.dataLoading = true;
    this.showPreview = true;

    let props = this.selectedEventProperties;

    let allEventIds = this.enrichmentService.data.map(row => row[':' + this.header]);
    
    const distinctArray = allEventIds.filter((n, i) => allEventIds.indexOf(n) === i);
    
    console.log('lengths')
    console.log(allEventIds)
    console.log(distinctArray.length)

    let requestUrl = 'customevents/select?ids=' + distinctArray.join(',') + '&propIds='+ props.join(',');
    
    const basedOn = this.isColDate ? 'date' : 'place';

    
    this.enrichmentService.getEventsExtension(basedOn, requestUrl).subscribe((httpResult : Extension[]) => {  
      this.extensionData = httpResult;
      if (this.extensionData.length > 0) {
        this.previewProperties = Array.from(this.extensionData[0].properties.keys());
      }
      this.dataLoading = false;
    })
      
    console.log('extensionData')
    console.log(this.extensionData)

    console.log('previewProperties')
    console.log(this.previewProperties)
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

  changeDateColumn(placeColValue) {
    this.readDatesFromCol = placeColValue;
  }

  changePlaceColumn(dateColValue) {
    this.readPlacesFromCol = dateColValue;

  }

  setManualPlace(row) {

    this.selectedPlace = this.dataSource[row].geonameId;
    this.dataSource = [];
  }

  private propertyWithReconciledValues(prop): boolean {
    let valid = true;
    this.extensionData.forEach((extension: Extension) => {
      const objects = extension.properties.get(prop);
      if (objects && objects.length !== extension.properties.get(prop).filter(obj => {
        return !(obj && !obj['id']);
      }).length) {
        valid = false;
      }
    });
    return valid;
  }


  geoSuggestions(new_val) {
    this.enrichmentService.geoNamesAutocomplete(this.selectedPlace).subscribe(data => {
      this.dataSource = data;
    });
  }

  text1Suggestions(new_val) {
    this.dataSource = this.enrichmentService.getText1Values(new_val)
  }

  categoriesSuggestions(new_val) {
    this.enrichmentService.googleCategoriesAutocomplete(this.selectedCategory).subscribe(data => {
      this.categorySuggestions = data;
    });
  }

  public _filter(value: string) {
    this.geoAllowedSources = [];
    const filterValue = value.toLowerCase();

    for (let i = 0; i < this.geo_Sources.length; i++) {
      if (this.geo_Sources[i].toLowerCase().search(filterValue) !== -1) {
        this.geoAllowedSources.push(this.geo_Sources[i]);
      }
    }
  }

  public _filterCategories(value: string) {
    this.categoriesAllowedSources = [];
    const filterValue = value.toLowerCase();

    for (let i = 0; i < this.categories_Sources.length; i++) {
      if (this.categories_Sources[i].toLowerCase().search(filterValue) !== -1) {
        this.categoriesAllowedSources.push(this.categories_Sources[i]);
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

    this.dataSource = [];
    this.geoAllowedSources = this.geo_Sources;
    this.allowedSources = this.enrichmentService.headers.filter(h => h !== this.header);

  }

}
