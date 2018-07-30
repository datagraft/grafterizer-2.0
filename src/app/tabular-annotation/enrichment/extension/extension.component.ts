import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {EnrichmentService} from '../enrichment.service';
import {Observable} from 'rxjs/Observable';
import {DeriveMap} from '../enrichment.model';

@Component({
  selector: 'app-extension',
  templateUrl: './extension.component.html',
  styleUrls: ['./extension.component.css']
})
export class ExtensionComponent implements OnInit {

  public header: any;
  public extensionData: any;

  public showPreview: boolean;
  public selectedProperties: any[];

  constructor(public dialogRef: MatDialogRef<ExtensionComponent>,
              @Inject(MAT_DIALOG_DATA) public dialogInputData: any,
              private enrichmentService: EnrichmentService) { }

  ngOnInit() {
    this.header = this.dialogInputData.header;
    this.showPreview = false;
    this.selectedProperties = [];
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

    this.selectedProperties.forEach(prop => {
      deriveMaps.push(new DeriveMap(prop.value.replace(/\s/g, '_')).buildFromExtension(prop.value, this.extensionData));
    });
    this.dialogRef.close({'deriveMaps': deriveMaps });

  }

  public extensionProperties = (): Observable<Response> => {
    return this.enrichmentService.propertiesAvailable();
  }
}
