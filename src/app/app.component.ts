import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { AppConfig } from './app.config';
import { DispatchService } from './dispatch.service';
import { TransformationService } from './transformation.service';
import { DataGraftMessageService } from './data-graft-message.service';
import { RoutingService } from './routing.service';
import { GlobalErrorReportingService } from './global-error-reporting.service';

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

  private globalErrorSubscription: Subscription;
  private globalErrors: Array<any>;

  constructor(public router: Router, private route: ActivatedRoute, private config: AppConfig,
    public dispatch: DispatchService, private transformationSvc: TransformationService,
    public messageSvc: DataGraftMessageService, private routingService: RoutingService,
    private globalErrorRepSvc: GlobalErrorReportingService) {

    this.routingServiceSubscription = this.routingService.getMessage().subscribe(url => {
      this.url = url;
    });
  }


  ngOnInit() {
    console.log('INITIALISING APP COMPONENT ');
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
              this.updatePreviewedData();
              // this subscription is no longer needed for the rest of the life of the app component
              this.updateDataRouteSubscription.unsubscribe();
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
      this.transformationSvc.previewTransformation(paramMap.get('filestoreId'), clojure, 0, 200)
        .then((result) => {
          console.log(this.previewedTransformationObj.pipelines[0]);
          console.log(result);
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

}
