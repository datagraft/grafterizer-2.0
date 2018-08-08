import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {EnrichmentService} from '../enrichment.service';
import {Observable} from 'rxjs/Observable';
import {ConciliatorService, DeriveMap, Extension, Property} from '../enrichment.model';

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

    this.selectedProperties = [];
    this.alreadyExtendedProperties = [];
    this.previewProperties = [];
    this.services = [];
    this.servicesGroups = [];

    if (this.enrichmentService.isColumnReconciled(this.header)) { // it should be always true!
      this.reconciledFromService = this.enrichmentService.getReconciliationServiceOfColumn(this.header);
      this.services.push(this.reconciledFromService);
    }

    this.services.push(new ConciliatorService({'id': 'ecwmf', 'name': 'ECMWF', group: 'weather'}));
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

  public submit() {
    const deriveMaps = [];
    console.log(this.propertyDescriptions);
    this.previewProperties.forEach((prop: string) => {
      deriveMaps.push(new DeriveMap(prop.replace(/\s/g, '_'))
        .buildFromExtension(prop, this.extensionData, [this.propertyDescriptions.get(prop).type].filter(p => p != null)));
    });
    this.dialogRef.close({
      'deriveMaps': deriveMaps,
      'conciliator': this.reconciledFromService
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

}
