import { Component, OnInit, OnDestroy } from '@angular/core';
import { AnnotationService } from './annotation.service';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/switch';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/fromEvent';
import { TransformationService } from '../transformation.service';
import { DispatchService } from '../dispatch.service';
import * as generateClojure from 'assets/generateclojure.js';
import * as transformationDataModel from 'assets/transformationdatamodel.js';
import { ActivatedRoute } from '@angular/router';
import { Http } from '@angular/http';

@Component({
  selector: 'app-tabular-annotation',
  templateUrl: './tabular-annotation.component.html',
  styleUrls: ['./tabular-annotation.component.css'],
  providers: [AnnotationService]
})

export class TabularAnnotationComponent implements OnInit, OnDestroy {

  // Local objects/ working memory initialized oninit - removed ondestroy, content transferred to observable ondestroy
  private transformationObj: any;
  private graftwerkData: any;

  constructor(public dispatch: DispatchService, public transformationSvc: TransformationService,
    public annotationService: AnnotationService, private route: ActivatedRoute,
    public http: Http) { }

  ngOnInit() {
    this.transformationSvc.currentTransformationObj.subscribe(message => this.transformationObj = message);
    this.transformationSvc.currentGraftwerkData.subscribe(message => this.graftwerkData = message);
    this.retrieveData();
    // this.retrieveDataFromJSONFile('assets/jot.json');    
  }

  ngOnDestroy() {
    this.transformationSvc.changeTransformationObj(this.transformationObj);
    this.transformationSvc.changeGraftwerkData(this.graftwerkData);
  }

  retrieveDataFromJSONFile(url) {
    this.http.get(url)
      .map(res => res.json())
      .subscribe(data => {
        this.annotationService.headers = data[':column-names'];
        this.annotationService.data = data[':rows'];
      });
  }

  retrieveData() {
    this.annotationService.headers = this.graftwerkData[':column-names'];
    this.annotationService.data = this.graftwerkData[':rows'];
  }
}
