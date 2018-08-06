import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {EnrichmentService} from '../enrichment.service';
import {Observable} from 'rxjs/Observable';
import {ConciliatorService, DeriveMap, Extension} from '../enrichment.model';

@Component({
  selector: 'app-extension',
  templateUrl: './extension.component.html',
  styleUrls: ['./extension.component.css']
})
export class ExtensionComponent implements OnInit {

  public header: any;
  public extensionData: any;

  public services: ConciliatorService[];

  public showPreview: boolean;
  public selectedProperties: any[];
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

    this.selectedProperties = [];
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
    let alreadyExtended = [];
    if (this.extensionData.length > 0) {
      alreadyExtended = Array.from(this.extensionData[0].properties.keys());
    }
    const properties = this.selectedProperties.filter(prop => !alreadyExtended.includes(prop.value)).map(prop => prop.value);
    if (properties.length > 0) {
      this.enrichmentService.extendColumn(this.header, properties).subscribe((data) => {
        if (this.extensionData.length > 0) { // join data
          data.forEach((ext: Extension) => {
            this.extensionData.find((extension: Extension) => extension.id === ext.id).addProperties(ext.properties);
          });
        } else {
          this.extensionData = data; // overwrite
        }
        this.dataLoading = false;
      });
    } else {
      this.dataLoading = false;
    }
  }

  public submit() {
    const deriveMaps = [];

    this.selectedProperties.forEach(prop => {
      deriveMaps.push(new DeriveMap(prop.value.replace(/\s/g, '_')).buildFromExtension(prop.value, this.extensionData));
    });
    this.dialogRef.close({'deriveMaps': deriveMaps });

  }

  public extensionProperties = (): Observable<Response> => {
    return this.enrichmentService.propertiesAvailable();
  }

}
