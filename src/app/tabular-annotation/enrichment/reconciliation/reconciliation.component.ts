import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {EnrichmentService} from '../enrichment.service';
import {ConciliatorService, DeriveMap} from '../enrichment.model';


@Component({
  selector: 'app-reconciliation',
  templateUrl: './reconciliation.component.html',
  styleUrls: ['./reconciliation.component.css']
})
export class ReconciliationComponent implements OnInit {

  public header: any;
  public data: any;
  public reconciledData: any;
  public selectedGroup: any;
  public selectedService: any;
  public services: ConciliatorService[];
  public newColumnName: string;
  public validMappingsCount: number;

  public showPreview: boolean;
  public reconcileButtonDisabled: boolean;

  constructor(public dialogRef: MatDialogRef<ReconciliationComponent>,
              @Inject(MAT_DIALOG_DATA) public dialogInputData: any,
              private enrichmentService: EnrichmentService) { }

  ngOnInit() {
    this.header = this.dialogInputData.header;
    this.services = [];
    this.enrichmentService.listServices().subscribe((data) => {
      Object.keys(data).forEach((serviceCategory) => {
        data[serviceCategory].forEach((service) => {
          this.services.push(new ConciliatorService(service['id'], service['name'], serviceCategory));
        });
      });
    });
    this.showPreview = false;
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

  public submit() {
    const deriveMaps = [];

    if (!this.newColumnName || this.newColumnName.trim().length === 0) {
      this.newColumnName = this.header + '_' + this.selectedService;
    }

    this.newColumnName = this.newColumnName.replace(/\s/g, '_');
    deriveMaps.push(new DeriveMap(this.newColumnName).buildFromMapping(this.reconciledData));
    this.dialogRef.close({
      'deriveMaps': deriveMaps,
      'conciliator': this.services.find(conciliator => conciliator.getId() === this.selectedService)
    });

  }

  servicesByGroup(group: string): ConciliatorService[] {
    return this.services.filter(s => s.getGroup() === group );
  }

  servicesGroups(): string [] {
    return Array.from(new Set(this.services.map(s => s.getGroup())));
  }

}
