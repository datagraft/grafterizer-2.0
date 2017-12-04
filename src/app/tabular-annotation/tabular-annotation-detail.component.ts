import { Component, OnInit, ViewChild, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router'
import { Annotation, AnnotationService } from "./annotation.service";
import { INglDatatableSort, INglDatatableRowClick } from 'ng-lightning/ng-lightning';

@Component({
  selector: 'tabular-annotation-detail',
  templateUrl: './tabular-annotation-detail.component.html',
  styleUrls: ['./tabular-annotation-detail.component.css'],
  providers: [AnnotationService]
})

//Detail Mode offers an accurate form for insert the annotation parameters, require the subject/object source and all off
//attributes for annotation (the same that you can add with annotation form)

export class TabularAnnotationDetailComponent implements OnInit, OnDestroy {

  //isSubject is true if the resource is marked as object in annotation form
  private annotation: Annotation;
  // isSubject : Boolean;
  // source : String ;
  // sourceLabel : String;
  // property : String;
  // propertyLabel : String;
  // columnType : String;
  // columnTypeLabel : String;
  colContent: any[];
  colId: any;
  header: any;
  data = [{ value: 3 }, { value: 4 }];

  public isActive: boolean = false;

  //ng-lightning attribute

  // Initial sort
  sort: INglDatatableSort = { key: 'value', order: 'asc' };

  constructor(private annotationService: AnnotationService, route: ActivatedRoute) { }

  ngOnInit() {
    this.colId = this.annotationService.colNum;
    this.annotation = this.annotationService.getAnnotation(this.colId);

    // this.isSubject = this.annotationService.isSubject[this.colId];
    // this.source = this.annotationService.source[this.colId];
    // this.sourceLabel = this.annotationService.sourceLabel[this.colId];
    // this.property = this.annotationService.property[this.colId];
    // this.propertyLabel = this.annotationService.propertyLabel[this.colId];
    // this.columnType = this.annotationService.columnType[this.colId];
    // this.columnTypeLabel = this.annotationService.columnTypeLabel[this.colId];
    this.colContent = this.annotationService.colContent.map(function makeObject(x) { return { value: x } });
    // console.log(this.colContent);
    // console.log(this.data);
    this.header = this.annotationService.header;
  }

  ngOnDestroy() {
    this.annotationService.setAnnotation(this.colId, this.annotation);
    //there will be n entities for n column, so onDestroy we need to send the data at the correct instance of
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

    let typeInput = (<HTMLInputElement>(document.getElementById("Type"))).value;
    let typeLabelInput = (<HTMLInputElement>(document.getElementById("TypeLabel"))).value;
    if ("" != typeInput)
      this.annotation.source = typeInput;
    if ("" != typeLabelInput)
      this.annotation.sourceLabel = typeLabelInput;

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
    if (dataType == "URL") {
      this.annotation.columnType = dataType;
    }
    else {
      this.annotation.columnType = dataType;
    }
  }

  onRowClick($event: INglDatatableRowClick) {
    console.log('clicked row', $event.data);
  }

}
