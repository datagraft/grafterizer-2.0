import {Component, Inject, OnInit} from '@angular/core';
import {AnnotationFormComponent} from '../annotation-form/annotation-form.component';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {EnrichmentService} from '../enrichment.service';

@Component({
  selector: 'app-enrichment',
  templateUrl: './enrichment.component.html',
  styleUrls: ['./enrichment.component.css']
})
export class EnrichmentComponent implements OnInit {

  public header: any;
  public data: any;
  public reconciledData: any;
  public selectedService: any;
  public servicesNames: string[];
  public services: Map<string, string>;
  public newColumnName: string;
  public validMappingsCount: number;

  public showPreview: boolean;

  constructor(public dialogRef: MatDialogRef<AnnotationFormComponent>,
              @Inject(MAT_DIALOG_DATA) public dialogInputData: any,
              private enrichmentService: EnrichmentService) { }

  ngOnInit() {
    this.header = this.dialogInputData.header;
    this.services = new Map<string, string>();
    this.services.set('LOCATION', 'location');
    this.services.set('CATEGORY', 'category');
    this.services.set('PRODUCT', 'product');
    this.servicesNames = Array.from(this.services.keys());

    this.showPreview = false;
  }

  public reconcile() {
    this.enrichmentService.reconcileColumn(this.header, this.selectedService)
      .subscribe((data) => {
        this.reconciledData = data;
        this.validMappingsCount = this.reconciledData.filter(v => v.results.length > 0).length;
        this.showPreview = true;
      });
  }

  public submit() {
    if (!this.newColumnName || this.newColumnName.trim().length === 0) {
      this.newColumnName = this.header + '_' + this.selectedService;
    }
    this.newColumnName = this.newColumnName.replace(/\s/g, '_');
    this.dialogRef.close({'mapping': this.reconciledData, 'colName': this.newColumnName });
  }

}
