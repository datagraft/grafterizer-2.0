import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { AppConfig } from './app.config';
import { DispatchService } from './dispatch.service';
import { TransformationService } from './transformation.service';
import { DataGraftMessageService } from './data-graft-message.service';
import { RoutingService } from './routing.service';
import { GlobalErrorHandler } from './global-error-handler';

import * as transformationDataModel from '../assets/transformationdatamodel.js';
import * as generateClojure from '../assets/generateclojure.js';
import * as data from '../assets/data.json';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [DispatchService, DataGraftMessageService, GlobalErrorHandler]
})
export class AppComponent implements OnInit {

  private basic = true;
  private url: any = 'transformation/new/';
  private subscription: Subscription;
  private routeSubscription: Subscription;

  private globalErrorSubscription: Subscription;
  private globalErrors: Array<any>;

  constructor(public router: Router, private route: ActivatedRoute, private config: AppConfig,
    public dispatch: DispatchService, private transformationSvc: TransformationService,
    public messageSvc: DataGraftMessageService, private routingService: RoutingService,
    private globalErrHandler: GlobalErrorHandler) {

    this.subscription = this.routingService.getMessage().subscribe(message => {
      this.url = message;
    });
  }


  ngOnInit() {
    const self = this;
    this.routeSubscription = this.router.events.subscribe(
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
                    console.log(transformationObj.pipelines[0].functions)
                    this.transformationSvc.changePreviewedTransformationObj(transformationObj);
                  }
                },
                (error) => {
                  console.log(error)
                });
          }
          self.routeSubscription.unsubscribe();
        }
      });

    this.globalErrorSubscription = this.globalErrHandler.globalErrorObs.subscribe((globalErrors) => {
      this.globalErrors = globalErrors;
    });
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
