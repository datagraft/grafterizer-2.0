import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {EnrichmentService} from '../enrichment.service';
import {Observable} from 'rxjs/Observable';
import {ConciliatorService, DeriveMap, Extension, Property, WeatherConfigurator} from '../enrichment.model';

@Component({
  selector: 'app-extension',
  templateUrl: './extension.component.html',
  styleUrls: ['./extension.component.css']
})
export class ExtensionComponent implements OnInit {

  public header: any;
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
  public selectedDate: any;
  public weatherParameters: string[];
  public weatherAggregators: string[];
  public weatherOffsets: number[];

  public selectedWeatherParameters: any[];
  public selectedWeatherOffsets: any[];
  public selectedWeatherAggregators: any[];

  public dateChoice: any;

  public dataLoading: boolean;

  public reconciledFromService: ConciliatorService;

  constructor(public dialogRef: MatDialogRef<ExtensionComponent>,
              @Inject(MAT_DIALOG_DATA) public dialogInputData: any,
              private enrichmentService: EnrichmentService) { }

  ngOnInit() {
    this.header = this.dialogInputData.header;
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

    if (this.enrichmentService.isColumnReconciled(this.header)) { // it should be always true!
      this.reconciledFromService = this.enrichmentService.getReconciliationServiceOfColumn(this.header);
      this.services.push(this.reconciledFromService);
      if (this.reconciledFromService.getId() === 'geonames') {
        this.services.push(new ConciliatorService({'id': 'ecmwf', 'name': 'ECMWF', group: 'weather'}));
      }
    }

    this.weatherOffsets = [0, 1, 2, 3, 4, 5, 6, 7];
    this.weatherParameters = ['10u', '10v', '2d', '2t', 'rh', 'sd', 'sf', 'sp', 'ssr', 'sund', 'tcc', 'tp', 'vis', 'ws'];
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

    if (this.dateChoice === 'fromCol') {
      weatherConfig = new WeatherConfigurator({...wcObj, ...{readDatesFromCol: this.readDatesFromCol}});
    } else {
      weatherConfig = new WeatherConfigurator({...wcObj, ...{date: this.selectedDate}});
    }

    this.enrichmentService.weatherData(this.header, weatherConfig).subscribe((data: Extension[]) => {
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
      'conciliator': conciliator
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

  changeDateColumn(dateColValue) {
    this.readDatesFromCol = dateColValue;
  }

  private propertyWithReconciledValues(prop): boolean {
    let valid = true;
    this.extensionData.forEach((extension: Extension) => {
      const objects = extension.properties.get(prop);
      if (objects.length !== extension.properties.get(prop).filter(obj => {
          return !(obj && !obj['id']);
        }).length) {
        valid = false;
      }
    });
    return valid;
  }
}
