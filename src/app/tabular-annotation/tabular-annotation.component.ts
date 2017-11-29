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

@Component({
  selector: 'app-tabular-annotation',
  templateUrl: './tabular-annotation.component.html',
  styleUrls: ['./tabular-annotation.component.css'],
  providers: [AnnotationService]
})
export class TabularAnnotationComponent implements OnInit {

  public data: Array<any>;
  public headers: Array<string>;
  public originalHeaders: Array<string>;

  constructor(public dispatch: DispatchService, public transformationSvc: TransformationService,
              private annotationService: AnnotationService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.data = [];
    this.headers = [];
    this.retrieveData();
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
                      this.originalHeaders = data[':column-names'];
                      this.data = data[':rows'];
                      // Remove leading ':' from the EDN response
                      this.originalHeaders.forEach((colname, index) => {
                        this.headers.push(colname.substring(1));
                      });
                      this.annotationService.generateColumnsName(this.headers);
                    }
                  },
                  (error) => console.log('Error previewing transformation!'));
            }
          },
          error => console.log(error));
    }
  }
}
