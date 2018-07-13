import {Component, Inject, OnInit} from '@angular/core';
import {AnnotationFormComponent} from '../annotation-form/annotation-form.component';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';

@Component({
  selector: 'app-enrichment',
  templateUrl: './enrichment.component.html',
  styleUrls: ['./enrichment.component.css']
})
export class EnrichmentComponent implements OnInit {

  public header: any;

  constructor(public dialogRef: MatDialogRef<AnnotationFormComponent>,
              @Inject(MAT_DIALOG_DATA) public dialogInputData: any) { }

  ngOnInit() {
    this.header = this.dialogInputData.header;
  }

}
