import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {AnnotationService} from './annotation.service';
import {INglDatatableRowClick, INglDatatableSort} from 'ng-lightning/ng-lightning';
import {Annotation} from './annotation.model';

@Component({
  selector: 'app-tabular-annotation-detail',
  templateUrl: './tabular-annotation-detail.component.html',
  styleUrls: ['./tabular-annotation-detail.component.css'],
})

// Detail Mode offers an accurate form for insert the annotation parameters, require the subject/object source and all off
// attributes for annotation (the same that you can add with annotation form)
// TODO: detail mode should be re-implemented!!

export class TabularAnnotationDetailComponent implements OnInit, OnDestroy {

  // isSubject is true if the resource is marked as object in annotation form
  private annotation: Annotation;
  // isSubject : Boolean;
  // source : String ;
  // sourceLabel : String;
  // property : String;
  // propertyLabel : String;
  // columnType : String;
  // columnTypeLabel : String;
  colContent: any[];
  header: any;
  data = [{ value: 3 }, { value: 4 }];

  public isActive = false;

  // ng-lightning attribute

  // Initial sort
  sort: INglDatatableSort = { key: 'value', order: 'asc' };

  constructor(private annotationService: AnnotationService, route: ActivatedRoute) { }

  ngOnInit() {
    this.annotation = this.annotationService.getAnnotation(this.header);

    // this.isSubject = this.annotationService.isSubject[this.colId];
    // this.source = this.annotationService.source[this.colId];
    // this.sourceLabel = this.annotationService.sourceLabel[this.colId];
    // this.property = this.annotationService.property[this.colId];
    // this.propertyLabel = this.annotationService.propertyLabel[this.colId];
    // this.columnType = this.annotationService.columnType[this.colId];
    // this.columnTypeLabel = this.annotationService.columnTypeLabel[this.colId];
    this.colContent = this.annotationService.data[this.header];
    // console.log(this.colContent);
    // console.log(this.data);
  }

  ngOnDestroy() {
    this.annotationService.setAnnotation(this.header, this.annotation);
    // there will be n entities for n column, so onDestroy we need to send the data at the correct instance of
    // annotationForm, identify by colId I think
    //   this.annotationService.isSubject[this.colId] = this.isSubject;
    //   this.annotationService.source[this.colId] = this.source;
    //   this.annotationService.sourceLabel[this.colId] = this.sourceLabel;
    //   this.annotationService.property[this.colId] = this.property;
    //   this.annotationService.propertyLabel[this.colId] = this.propertyLabel;
    //   this.annotationService.columnType[this.colId] = this.columnType;
    //   this.annotationService.columnTypeLabel[this.colId] = this.columnTypeLabel;
  }

  saveChanges() {

    const typeInput = (<HTMLInputElement>(document.getElementById('Type'))).value;
    const typeLabelInput = (<HTMLInputElement>(document.getElementById('TypeLabel'))).value;
    if ('' !== typeInput) {
      this.annotation.subject = typeInput;
    }
    // if ('' != typeLabelInput)
    //   this.annotation.sourceLabel = typeLabelInput;

    // if (!this.annotation.isSubject) {
    //   let propertyInput = (<HTMLInputElement>(document.getElementById("Property"))).value;
    //   let propertyLabelInput = (<HTMLInputElement>(document.getElementById("PropertyLabel"))).value;
    //   let dataTypeLabelInput = (<HTMLInputElement>(document.getElementById("DataTypeLabel"))).value;
    //
    //   if ("" != propertyInput)
    //     this.annotation.property = propertyInput;
    //   if ("" != propertyLabelInput)
    //     this.annotation.propertyLabel = propertyLabelInput;
    //   if ("" != dataTypeLabelInput)
    //     this.annotation.columnTypeLabel = dataTypeLabelInput;
    //
    //
    // }
  }

  // objectSelect() {
  //   this.isSubject = false;
  // }

  // subjectSelect(isSubject) {
  //   if (isSubject == 'O') {
  //     this.annotation.isSubject = false;
  //   }
  //   else {
  //     this.annotation.isSubject = true;
  //   }
  // }

  // dataTypeURL(){
  //   this.columnType = "URL";
  // }
  //
  // dataTypeLiteral(){
  //   this.columnType = "Literal";
  // }

  dataTypeSelect(dataType) {
    // if (dataType === 'URL') {
    //   this.annotation.columnTypes = dataType;
    // } else {
    //   this.annotation.columnTypes = dataType;
    // }
  }

  onRowClick($event: INglDatatableRowClick) {
    console.log('clicked row', $event.data);
  }
}
