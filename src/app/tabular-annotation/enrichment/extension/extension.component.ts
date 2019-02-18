import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {EnrichmentService} from '../enrichment.service';
import {Observable} from 'rxjs';
import {ConciliatorService, DeriveMap, Extension, Property, WeatherConfigurator} from '../enrichment.model';

@Component({
  selector: 'app-extension',
  templateUrl: './extension.component.html',
  styleUrls: ['./extension.component.css']
})
export class ExtensionComponent implements OnInit {

  public header: any;
  public previewHeader: any;
  public colIndex: any;
  public isColDate : boolean;
  public isColReconciled : boolean;

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
  public readDatesFromCol: string;
  public readPlacesFromCol: string;
  public selectedDate: any;
  public selectedPlace: any;

  public weatherParameters: string[];
  public weatherParametersDescriptions: any;
  public weatherAggregators: string[];
  public weatherOffsets: number[];

  public selectedWeatherParameters: any[];
  public selectedWeatherOffsets: any[];
  public selectedWeatherAggregators: any[];

  public dateChoice: any;
  public placeChoice: any;

  public dataLoading: boolean;

  public reconciledFromService: ConciliatorService;

  public shiftColumn: boolean = false;

  constructor(public dialogRef: MatDialogRef<ExtensionComponent>,
              @Inject(MAT_DIALOG_DATA) public dialogInputData: any,
              private enrichmentService: EnrichmentService) { }

  ngOnInit() {
    this.header = this.dialogInputData.header;
    this.previewHeader = this.header;
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

    if (!this.isColReconciled && this.isColDate)
    {
      this.services.push(new ConciliatorService({'id': 'ecmwf', 'name': 'ECMWF', group: 'weather'}));
      this.reconciledFromService = new ConciliatorService({'id': 'geonames', 'name': 'GeoNames', group: 'geo', identifierSpace: 'http://sws.geonames.org/', schemaSpace: 'http://www.geonames.org/ontology# ExtensionECMWF'});
    }
    else if (this.isColReconciled && !this.isColDate)
    {
      this.reconciledFromService = this.enrichmentService.getReconciliationServiceOfColumn(this.header);
      this.services.push(this.reconciledFromService);
      if (this.reconciledFromService.getId() === 'geonames') {
        this.services.push(new ConciliatorService({'id': 'ecmwf', 'name': 'ECMWF', group: 'weather'}));

      }
    }
    else if (this.isColReconciled && this.isColDate)
    {
    /*  this.reconciledFromService = this.enrichmentService.getReconciliationServiceOfColumn(this.header);
      this.services.push(this.reconciledFromService);
      if (this.reconciledFromService.getId() === 'geonames') {
        this.services.push(new ConciliatorService({'id': 'ecmwf', 'name': 'ECMWF', group: 'weather'}));

      }
      */
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
  }

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

    let weatherConfig = null;
    const wcObj = {parameters: this.selectedWeatherParameters,
      aggregators: this.selectedWeatherAggregators,
      offsets: this.selectedWeatherOffsets
    };
    if(this.isColReconciled && !this.isColDate)
    {
      if (this.dateChoice === 'fromCol')
      {
        weatherConfig = new WeatherConfigurator({...wcObj, ...{readDatesFromCol: this.readDatesFromCol}});
      }
      else
      {
        weatherConfig = new WeatherConfigurator({...wcObj, ...{date: this.selectedDate}});
      }
      this.enrichmentService.weatherData(this.header, weatherConfig).subscribe((data: Extension[]) => {
        this.extensionData = data;
        if (this.extensionData.length > 0) {
          this.previewProperties = Array.from(this.extensionData[0].properties.keys());
        }
        this.dataLoading = false;
      });
    }//end if (this.isColReconciled && !this.isColDate)
    else if (!this.isColReconciled && this.isColDate)
    {
      if (this.placeChoice === 'fromCol')
      {
        weatherConfig = new WeatherConfigurator({...wcObj, ...{readDatesFromCol: this.header}});
      }
      this.previewHeader = this.readPlacesFromCol;

      this.enrichmentService.weatherData(this.readPlacesFromCol, weatherConfig).subscribe((data: Extension[]) => {
        this.extensionData = data;
        if (this.extensionData.length > 0)
        {
          this.previewProperties = Array.from(this.extensionData[0].properties.keys());
        }
        this.dataLoading = false;
      });


    }//end if (!this.isColReconciled && this.isColDate)
    else if (this.isColReconciled && this.isColDate)
    {
      /*if (this.placeChoice === 'fromCol') {
        weatherConfig = new WeatherConfigurator({...wcObj, ...{readDatesFromCol: this.header}});
      }
      this.previewHeader = this.readPlacesFromCol;

      this.enrichmentService.weatherData(this.readPlacesFromCol, weatherConfig).subscribe((data: Extension[]) => {
        this.extensionData = data;
        if (this.extensionData.length > 0) {
          this.previewProperties = Array.from(this.extensionData[0].properties.keys());
        }
        this.dataLoading = false;
      });
       to do */

    }
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
}
