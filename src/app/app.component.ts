import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import 'rxjs/Rx';
import { Subscription } from 'rxjs/Subscription';
import { AppConfig } from './app.config';
import { DispatchService } from './dispatch.service';
import { TransformationService } from './transformation.service';
import { DataGraftMessageService } from './data-graft-message.service';
import { RoutingService } from './routing.service';
import { GlobalErrorReportingService } from './global-error-reporting.service';
import { PipelineEventsService } from './tabular-transformation/pipeline-events.service';

import * as transformationDataModel from '../assets/transformationdatamodel.js';
import * as generateClojure from '../assets/generateclojure.js';
import * as data from '../assets/data.json';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [DispatchService, DataGraftMessageService]
})
export class AppComponent implements OnInit {
  private basic = true;
  private url: any = 'transformation/new/';
  private routingServiceSubscription: Subscription;
  private initRouteSubscription: Subscription;
  private updateDataRouteSubscription: Subscription;

  private previewedTransformationSubscription: Subscription;
  private previewedTransformationObj: any;

  private transformationObjSourceSubscription: Subscription;
  private transformationObjSource: any;

  private globalErrorSubscription: Subscription;
  private globalErrors: Array<any>;

  constructor(public router: Router, private route: ActivatedRoute, private config: AppConfig,
    public dispatch: DispatchService, private transformationSvc: TransformationService,
    public messageSvc: DataGraftMessageService, private routingService: RoutingService,
    private globalErrorRepSvc: GlobalErrorReportingService, private pipelineEventsSvc: PipelineEventsService) {

    this.routingServiceSubscription = this.routingService.getMessage().subscribe(url => {
      this.url = url;
    });
  }

  test() {
    console.log('test OK')
  }


  ngOnInit() {
    const self = this;
    this.initRouteSubscription = this.router.events.subscribe(
      (event) => {
        if (event instanceof NavigationEnd) {
          const paramMap = self.route.firstChild.snapshot.paramMap;
          if (paramMap.has('publisher') && paramMap.has('transformationId')) {
            self.dispatch.getTransformationJson(paramMap.get('transformationId'), paramMap.get('publisher'))
              .then(
                (result) => {
                  const transformationObj = transformationDataModel.Transformation.revive(result);
                  self.transformationSvc.changeTransformationObj(transformationObj);
                  if (paramMap.has('filestoreId')) {
                    this.transformationSvc.changePreviewedTransformationObj(transformationObj);
                  }
                },
                (error) => {
                  console.log(error);
                });
          }
          self.initRouteSubscription.unsubscribe();
        }
      });

    this.transformationObjSourceSubscription = this.transformationSvc.currentTransformationObj
      .subscribe((currentTransformationObj) => {
        this.transformationObjSource = currentTransformationObj;
      });


    this.previewedTransformationSubscription = this.transformationSvc.currentPreviewedTransformationObj
      .subscribe((previewedTransformation) => {
        this.previewedTransformationObj = previewedTransformation;
        // Check if routes of sub-components of the app component have been initialised (firstChild is null if not)
        if (!this.route.firstChild) {
          // We use this subscription to catch the moment when the navigation has ended
          this.updateDataRouteSubscription = this.router.events.subscribe((event) => {
            // If the event for navigation end is emitted, the child components are initialised.
            // We can proceed to updating the previewed data.
            if (event instanceof NavigationEnd) {
              this.pipelineEventsSvc.changePipelineEvent({
                startEdit: false, // true when we click on the 'Edit' icon of a function
                commitEdit: false, // true when we click 'OK' after editing a function
                preview: false, // true when we are previewing a step in the pipeline
                delete: false, // true when we are deleting a step in the pipeline
                createNew: false, // true when we are adding a new step to the pipeline
                newStepType: "", // type of the new step to be added to the pipeline
                defaultParams: {}, // default parameters for a new step (could be given by recommender)
                commitCreateNew: false // true when we click OK after creating a new function
              });
            }
          });
        } else {
          // the sub-components are already initialised, so we can get the route parameters as normal
          this.updatePreviewedData();
        }
      });

    this.globalErrorSubscription = this.globalErrorRepSvc.globalErrorObs.subscribe((globalErrors) => {
      this.globalErrors = globalErrors;
    });
  }

  updatePreviewedData() {
    this.globalErrorRepSvc.changePreviewError(undefined);
    const paramMap = this.route.firstChild.snapshot.paramMap;

    if (paramMap.has('publisher') && paramMap.has('transformationId') && paramMap.has('filestoreId')) {
      const clojure = generateClojure.fromTransformation(this.previewedTransformationObj);
      this.transformationSvc.previewTransformation(paramMap.get('filestoreId'), clojure, 0, 60000000)
        .then((result) => {
          this.transformationSvc.changeGraftwerkData(result);
        }, (err) => {
          this.globalErrorRepSvc.changePreviewError(err);
          this.transformationSvc.changeGraftwerkData(
            {
              ':column-names': [],
              ':rows': []
            });
        });
    }
  }

  onClose(index) {
    this.globalErrors.splice(index, 1);
    this.globalErrorRepSvc.changeGlobalErrors(this.globalErrors);
  }

  fileChange(event) {
    const fileList: FileList = event.target.files;
    if (fileList.length > 0) {
      const file: File = fileList[0];
      this.dispatch.uploadFile(file)
        .then(
          (result) => {
            console.log('Successfully uploaded file!');
            console.log(result);
          },
          (error) => {
            console.log('Error uploading file!');
            console.log(error);
          });
    }
  }

  save() {
    // Persist the Graph to DataGraft
    const paramMap = this.route.firstChild.snapshot.paramMap;
    if (paramMap.has('transformationId') && paramMap.has('publisher')) {
      const publisher = paramMap.get('publisher');
      const existingTransformationID = paramMap.get('transformationId');
      const clojureCode = generateClojure.fromTransformation(this.transformationObjSource);
      let newTransformationName = null;
      let newTransformationDescription = null;
      let newTransformationKeywords = null;
      let isPublic = null;
      this.transformationSvc.currentTransformationMetadata.subscribe((result) => {
        newTransformationName = result.title;
        newTransformationDescription = result.description;
        newTransformationKeywords = result.keywords;
        isPublic = result.isPublic;
      }
      );
      let transformationType = 'graft';
      let transformationCommand = 'my-graft';
      if (this.transformationObjSource.graphs === 0) {
        transformationType = 'pipe';
        transformationCommand = 'my-pipe';
      }
      const newTransformationConfiguration = {
        type: transformationType,
        command: transformationCommand,
        code: clojureCode,
        json: JSON.stringify(this.transformationObjSource)
      };

      return this.dispatch.updateTransformation(existingTransformationID,
        publisher,
        newTransformationName,
        isPublic,
        newTransformationDescription,
        newTransformationKeywords,
        newTransformationConfiguration).then(
          (result) => {
            console.log('Data uploaded');
          },
          (error) => {
            console.log('Error updating transformation');
            console.log(error);
          });
    }
  }

  saveTriplesToFile(data, filename) {
    var blob = new Blob([data], { type: 'application/n-triples' }),
      e = document.createEvent('MouseEvents'),
      a = document.createElement('a')
    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveOrOpenBlob(blob, filename);
    }
    else {
      var e = document.createEvent('MouseEvents'),
        a = document.createElement('a');
      a.download = filename;
      a.href = window.URL.createObjectURL(blob);
      a.dataset.downloadurl = ['text/plain', a.download, a.href].join(':');
      e.initEvent('click', true, false);
      a.dispatchEvent(e);
    }
  }

  download(rdfFormat: string = 'nt') {
    this.save().then(
      () => {
        console.log('Data downloads');
        const paramMap = this.route.firstChild.snapshot.paramMap;
        if (paramMap.has('transformationId') && paramMap.has('filestoreId')) {
          const existingTransformationID = paramMap.get('transformationId');
          const filestoreID = paramMap.get('filestoreId');
          this.transformationSvc.transformFile(filestoreID, existingTransformationID, 'graft', rdfFormat).then(
            (transformed) => {
              this.saveTriplesToFile(transformed, 'triples.nt');
            },
            (error) => {
              console.log('Error transforming file');
              console.log(error);
            }
          );
        }
      }
    );
  }
}
