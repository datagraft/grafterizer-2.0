import {Component, Inject, OnInit, ViewChild, ElementRef} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatTableDataSource,
  MatAutocompleteSelectedEvent,
  MatChipInputEvent,
  MatAutocomplete
} from '@angular/material';
import {EnrichmentService} from '../enrichment.service';
import {Observable} from 'rxjs';
import {ConciliatorService, DeriveMap, Extension, Property, WeatherConfigurator} from '../enrichment.model';
import {HttpClient, HttpParams} from '@angular/common/http';

@Component({
  selector: 'app-extension',
  templateUrl: './extension.component.html',
  styleUrls: ['./extension.component.css']
})
export class ExtensionComponent implements OnInit {
  public isGeonamesColumn: boolean = false;
  public isCategoriesColumn: boolean = false;
  public dataSource: any;
  public categorySuggestions: any;
  public displayedColumns: string[] = ['placeSuggestions'];
  public geo_answer: any;
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
  public dateChoice: any;
  public placeChoice: any;
  public categoryChoice: any;
  public dataLoading: boolean;
  public reconciledFromService: ConciliatorService;
  public shiftColumn: boolean = false;
  public selectedChipsPlaces: any = [];
  public selectedChipsCategories: any = [];


  @ViewChild('inputCategoriesChips') inputCategoriesChips: ElementRef<HTMLInputElement>;
  @ViewChild('inputPLaceChips') inputPLaceChips: ElementRef<HTMLInputElement>;

  constructor(public dialogRef: MatDialogRef<ExtensionComponent>,
              private http: HttpClient,
              @Inject(MAT_DIALOG_DATA) public dialogInputData: any,
              private enrichmentService: EnrichmentService) {
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

    if (!this.isColReconciled && this.isColDate) {
      this.services.push(new ConciliatorService({'id': 'ecmwf', 'name': 'ECMWF', group: 'weather'}));
      this.services.push(new ConciliatorService({'id': 'er', 'name': 'EventRegistry', group: 'events'}));
      this.reconciledFromService = new ConciliatorService({
        'id': 'geonames',
        'name': 'GeoNames',
        group: 'geo',
        identifierSpace: 'http://sws.geonames.org/',
        schemaSpace: 'http://www.geonames.org/ontology# ExtensionECMWF'
      });
    } else if (this.isColReconciled && !this.isColDate) {
      this.reconciledFromService = this.enrichmentService.getReconciliationServiceOfColumn(this.header);
      this.services.push(this.reconciledFromService);
      if (this.reconciledFromService.getId() === 'geonames') {
        this.isGeonamesColumn = true;
        this.services.push(new ConciliatorService({'id': 'ecmwf', 'name': 'ECMWF', group: 'weather'}));
        this.services.push(new ConciliatorService({'id': 'er', 'name': 'EventRegistry', group: 'events'}));
      } else if (this.reconciledFromService.getId() === 'productsservices') {
        this.isCategoriesColumn = true;
        this.services.push(new ConciliatorService({'id': 'er', 'name': 'EventRegistry', group: 'events'}));
      }
      //
    } else if (this.isColReconciled && this.isColDate) {

      //to do
    }

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
    this.weatherAggregators = ['avg', 'min', 'max'];
  }//end ngOnInit

  public extend() {
    this.dataLoading = true;
    this.showPreview = true;

    const properties = this.selectedProperties
      .filter(prop => !this.alreadyExtendedProperties.includes(prop.value))
      .map(prop => prop.value);
    if (properties.length > 0) {
      this.enrichmentService.extendColumn(this.header, properties).subscribe((data) => {
        if (this.extensionData.length > 0) { // join data
          data['ext'].forEach((ext: Extension) => {
            this.extensionData.find((extension: Extension) => extension.id === ext.id).addProperties(ext.properties);
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
    const wcObj = {
      parameters: this.selectedWeatherParameters,
      aggregators: this.selectedWeatherAggregators,
      offsets: this.selectedWeatherOffsets
    };

    let dateConfig = {};
    let placeConfig = {};

    if (this.isColDate) {
      dateConfig = {readDatesFromCol: this.header};
    } else if (this.dateChoice === 'fromCol') {
      dateConfig = {readDatesFromCol: this.readDatesFromCol};
    } else {
      dateConfig = {date: this.selectedDate};
    }

    if (!this.isColDate) {
      placeConfig = {readPlacesFromCol: this.header};
    } else if (this.placeChoice === 'fromCol') {
      placeConfig = {readPlacesFromCol: this.readPlacesFromCol};
    } else {
      placeConfig = {place: this.selectedPlace};
    }

    const weatherConfig = new WeatherConfigurator({...wcObj, ...dateConfig, ...placeConfig});
    const basedOn = this.isColDate ? 'date' : 'place';

    this.enrichmentService.weatherData(basedOn, weatherConfig).subscribe((data: Extension[]) => {
      this.extensionData = data;
      if (this.extensionData.length > 0) {
        this.previewProperties = Array.from(this.extensionData[0].properties.keys());
      }
      this.dataLoading = false;
    });
  }

  public submit() {
    const deriveMaps = [];
    let conciliator = null;
    this.previewProperties.forEach((prop: string) => {
      const propDescr = this.propertyDescriptions.get(prop) && this.propertyDescriptions.get(prop).type || null;

      if (this.propertyWithReconciledValues(prop)) {
        conciliator = this.reconciledFromService;
      }
      deriveMaps.push(new DeriveMap(prop.replace(/\s/g, '_'))
        .buildFromExtension(prop, this.extensionData, [propDescr].filter(p => p != null)));
    });
    this.dialogRef.close({
      'deriveMaps': deriveMaps,
      'conciliator': conciliator,
      'shift': this.shiftColumn,
      'header': this.previewHeader,
      'indexCol': this.colIndex
    });
  }

  public extensionProperties = (): Observable<Response> => {
    return this.enrichmentService.propertiesAvailable();
  };

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
    this.dataSource = [];
    if (new_val && new_val.length > 1) {
      this.http.get('http://api.geonames.org/searchJSON?q=' + this.selectedPlace + '&maxRows=50&featureClass=A&username=asia_geo')
        .subscribe(data => {
          this.dataSource = data['geonames'];
        });
    }
  }


  categoriesSuggestions(new_val) {
    //to do --> http call for cateogories entities suggestions

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

  addCategoriesChips(categories: string): void {
    //to do -> method than add chips

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

  event() {
    this.showPreview = true;
    //to do method for EventRegistry service
  }

}
