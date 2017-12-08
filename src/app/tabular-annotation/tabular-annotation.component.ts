import {Component, OnInit} from '@angular/core';
import {AnnotationService} from './annotation.service';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/switch';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/fromEvent';
import {TransformationService} from '../transformation.service';
import {DispatchService} from '../dispatch.service';
import * as generateClojure from 'assets/generateclojure.js';
import * as transformationDataModel from 'assets/transformationdatamodel.js';
import {ActivatedRoute} from '@angular/router';
import {Http} from '@angular/http';

@Component({
  selector: 'app-tabular-annotation',
  templateUrl: './tabular-annotation.component.html',
  styleUrls: ['./tabular-annotation.component.css'],
  providers: [AnnotationService]
})
export class TabularAnnotationComponent implements OnInit {
  constructor(public dispatch: DispatchService, public transformationSvc: TransformationService,
              public annotationService: AnnotationService, private route: ActivatedRoute,
              public http: Http) {}

  ngOnInit() {
    this.retrieveDataFromJSONFile('assets/jot.json');
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
    const paramMap = this.route.snapshot.paramMap;
    if (paramMap.has('publisher') && paramMap.has('transformationId')) {
    }

    if (paramMap.has('publisher') && paramMap.has('transformationId')) {
      this.dispatch.getTransformationJson(paramMap.get('transformationId'), paramMap.get('publisher'))
        .then(
          (result) => {
            console.log('Got transformation JSON');
            const clojure = generateClojure.fromTransformation(transformationDataModel.Transformation.revive(result));
            console.log('Generated Clojure!');
            if (paramMap.has('filestoreId')) {
              this.transformationSvc.previewTransformation(paramMap.get('filestoreId'), clojure)
                .then(
                  (data) => {
                    // console.log("Successfully previewed transformation!");
                    console.log(data);
                    if (data[':column-names'] && data[':rows']) {
                      const originalHeaders = data[':column-names'];
                      this.annotationService.data = data[':rows'];
                      // Remove leading ':' from the EDN response
                      originalHeaders.forEach((colname, index) => {
                        this.annotationService.headers.push(colname.substring(1));
                      });
                    }
                  },
                  (error) => console.log('Error previewing transformation!'));
            }
          },
          error => console.log(error));
    }
  }
}
