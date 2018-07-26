import {Component, Inject, OnInit} from '@angular/core';
import {AnnotationFormComponent} from '../annotation-form/annotation-form.component';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {EnrichmentService} from '../enrichment.service';
import {Observable} from 'rxjs/Observable';
import {ConciliatorService, DeriveMap} from '../enrichment.model';

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
  public selectedGroup: any;
  public selectedService: any;
  public services: ConciliatorService[];
  public newColumnName: string;
  public validMappingsCount: number;

  public showPreview: boolean;
  public isColumnReconciled: boolean;
  public selectedProperties: any[];
  public reconcileButtonDisabled: boolean;

  constructor(public dialogRef: MatDialogRef<AnnotationFormComponent>,
              @Inject(MAT_DIALOG_DATA) public dialogInputData: any,
              private enrichmentService: EnrichmentService) { }

  ngOnInit() {
    this.header = this.dialogInputData.header;
    this.isColumnReconciled = this.enrichmentService.isColumnReconciled(this.header);
    this.services = [];
    this.enrichmentService.listServices().subscribe((data) => {
      Object.keys(data).forEach((serviceCategory) => {
        data[serviceCategory].forEach((service) => {
          this.services.push(new ConciliatorService(service['id'], service['name'], serviceCategory));
        });
      });
    });
    this.showPreview = false;
    this.selectedProperties = [];
    this.reconcileButtonDisabled = true;
  }

  public reconcile() {
    this.enrichmentService.reconcileColumn(this.header, this.selectedService).subscribe((data) => {
        this.reconciledData = data;
        this.validMappingsCount = this.reconciledData.filter(v => v.results.length > 0).length;
        this.showPreview = true;
        this.reconcileButtonDisabled = true;
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
        this.newColumnName = this.header + '_' + this.selectedGroup;
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

  servicesByGroup(group: string): ConciliatorService[] {
    return this.services.filter(s => s.getGroup() === group );
  }

  servicesGroups(): string [] {
    return Array.from(new Set(this.services.map(s => s.getGroup())));
  }

}
