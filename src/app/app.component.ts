import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { AppConfig } from './app.config';
import { DispatchService } from './dispatch.service';
import { TransformationService } from './transformation.service';
import { DataGraftMessageService } from './data-graft-message.service';
import { RouterUrlService } from './tabular-transformation/component-communication.service';

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
  private subscription: Subscription;
  private routeSubscription: Subscription;

  constructor(public router: Router, private route: ActivatedRoute, private config: AppConfig,
               public dispatch: DispatchService, private transformationSvc: TransformationService,
               public messageSvc: DataGraftMessageService, private routerService: RouterUrlService) {
    this.subscription = this.routerService.getMessage().subscribe(message => {
      this.url = message;
      //      console.log(message);
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
                  const clojure = generateClojure.fromTransformation(transformationObj);
                  // TODO hack??
                  self.transformationSvc.previewTransformation(paramMap.get('filestoreId'), clojure, 1, 600)
                    .then(
                    (resultData) => {
                      console.log(resultData);
                      self.transformationSvc.changeGraftwerkData(resultData);
                    },
                    (error) => {
                      console.log('ERROR getting filestore!');
                      console.log(error);
                    });
                }
              },
              (error) => {
                console.log(error)
              });
          }
          self.routeSubscription.unsubscribe();
        }
      });
    /*this.routeSubscription = this.route.params.subscribe((params) => {
      console.log(params);


      console.log('starting...');
      const paramMap = this.route.snapshot.paramMap;
      if (paramMap.has('publisher') && paramMap.has('transformationId')) {
        this.dispatch.getTransformationJson(paramMap.get('transformationId'), paramMap.get('publisher'))
          .then(
          (result) => {
            const transformationObj = transformationDataModel.Transformation.revive(result);
            console.log(transformationObj)
            if (paramMap.has('filestoreId')) {
              const clojure = generateClojure.fromTransformation(transformationObj);
              this.transformationSvc.previewTransformation(paramMap.get('filestoreId'), clojure, 1, 600)
                .then(
                (resultData) => {
                  console.log(resultData);
                  this.transformationSvc.transformationObj = transformationObj;
                  this.transformationSvc.graftwerkData = resultData;
                  console.log('Done!')
                },
                (error) => {
                  console.log('ERROR getting filestore!');
                  console.log(error);
                });
            }
          },
          (error) => {
            console.log(error)
          });
      }
    });*/
  }

  fileChange(event) {
    const fileList: FileList = event.target.files;
    if (fileList.length > 0) {
      let file: File = fileList[0];
      this.dispatch.uploadFile(file)
        .then(
        (result) => {
          console.log("Successfully uploaded file!");
          console.log(result);
        },
        (error) => {
          console.log("Error uploading file!");
          console.log(error);
        });
    }
  }

}
