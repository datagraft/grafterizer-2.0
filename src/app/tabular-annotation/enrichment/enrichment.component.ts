import {Component, Inject, OnInit} from '@angular/core';
import {AnnotationFormComponent} from '../annotation-form/annotation-form.component';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {EnrichmentService} from '../enrichment.service';
import {Observable} from 'rxjs/Observable';
import {DeriveMap} from '../enrichment.model';

@Component({
  selector: 'app-enrichment',
  templateUrl: './enrichment.component.html',
  styleUrls: ['./enrichment.component.css']
})
export class EnrichmentComponent implements OnInit {

  public header: any;
  public data: any;
  public reconciledData: any;
  public extensionData: any;
  public selectedService: any;
  public servicesNames: string[];
  public services: Map<string, string>;
  public newColumnName: string;
  public validMappingsCount: number;

  public showPreview: boolean;
  public isColumnReconciled: boolean;
  public selectedProperties: any[];

  constructor(public dialogRef: MatDialogRef<AnnotationFormComponent>,
              @Inject(MAT_DIALOG_DATA) public dialogInputData: any,
              private enrichmentService: EnrichmentService) { }

  ngOnInit() {
    this.header = this.dialogInputData.header;
    this.isColumnReconciled = this.enrichmentService.isColumnReconciled(this.header);
    this.services = new Map<string, string>();
    this.services.set('LOCATION', 'location');
    this.services.set('CATEGORY', 'category');
    this.services.set('PRODUCT', 'product');
    this.servicesNames = Array.from(this.services.keys());
    this.showPreview = false;
    this.selectedProperties = [];
  }

  public reconcile() {
    this.enrichmentService.reconcileColumn(this.header, this.selectedService).subscribe((data) => {
        this.reconciledData = data;
        this.validMappingsCount = this.reconciledData.filter(v => v.results.length > 0).length;
        this.showPreview = true;
      });
  }

  public extend() {
    const properties = this.selectedProperties.map(prop => prop.value);
    this.enrichmentService.extendColumn(this.header, properties).subscribe((data) => {
      this.extensionData = data;
      this.showPreview = true;
    });
  }

  public submit() {
    const deriveMaps = [];
    if (!this.isColumnReconciled) { // reconciliation
      if (!this.newColumnName || this.newColumnName.trim().length === 0) {
        this.newColumnName = this.header + '_' + this.selectedService;
      }
      this.newColumnName = this.newColumnName.replace(/\s/g, '_');
      deriveMaps.push(new DeriveMap(this.newColumnName).buildFromMapping(this.reconciledData));
    } else { // extension
      this.selectedProperties.forEach(prop => {
        deriveMaps.push(new DeriveMap(prop.value.replace(/\s/g, '_')).buildFromExtension(prop.value, this.extensionData));
      });
    }

    this.dialogRef.close({'deriveMaps': deriveMaps });
  }

  public extensionProperties = (): Observable<Response> => {
    return this.enrichmentService.propertiesAvailable();
  }

}
