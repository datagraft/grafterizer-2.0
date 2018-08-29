import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { Http } from '@angular/http';
import 'rxjs/Rx';
import { SelectItem } from 'primeng/primeng';
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

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [DispatchService, DataGraftMessageService]
})
export class AppComponent implements OnInit {
  private loadingNextStepMessage: string;
  private nextStepDialogMessage = 'The result of this transformation will be saved in DataGraft';
  private fillingWizard = false;
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

  private isEmbedded: boolean;
  private downloadMode: string = 'csv';

  private distributionList: SelectItem[] = [];
  private selectedFile: any;

  private showConfirmNextStepDialog: boolean = false;
  private showDownloadDialog: boolean = false;
  private showConfirmDeleteDialog: boolean = false;
  private showLoadDistributionDialog: boolean = false;
  private modalEnabled: boolean = false;
  private showTabularAnnotationTab: boolean = false;
  private showRdfMappingTab: boolean = false;
  private showSaveButton: boolean = false;
  private showForkButton: boolean = false;
  private showDownloadButton: boolean = false;
  private showDeleteButton: boolean = false;
  private showLoading: boolean = false;

  constructor(public router: Router, private http: Http, private route: ActivatedRoute, private config: AppConfig,
    public dispatch: DispatchService, private transformationSvc: TransformationService,
    public messageSvc: DataGraftMessageService, private routingService: RoutingService,
    private globalErrorRepSvc: GlobalErrorReportingService, private pipelineEventsSvc: PipelineEventsService) {
    console.log("this.messageSvc.isEmbeddedMode(): " + this.messageSvc.isEmbeddedMode());
    this.isEmbedded = this.messageSvc.isEmbeddedMode();
    this.routingServiceSubscription = this.routingService.getMessage().subscribe(url => {
      this.url = url;
    });
  }

  ngOnInit() {

    const self = this;

    this.messageSvc.getDataGraftMessage().subscribe(result => {
      if (result) {
        console.log(result);
        this.initRouteSubscription = this.router.events.subscribe(
          (event) => {
            if (event instanceof NavigationEnd) {
              const paramMap = self.route.firstChild.snapshot.paramMap;
              if (paramMap.has('publisher') && paramMap.has('transformationId')) {
                self.dispatch.getTransformationJson(paramMap.get('transformationId'), paramMap.get('publisher'))
                  .then(
                    (result) => {
                      if (result !== 'Beginning OAuth Flow') {
                        const transformationObj = transformationDataModel.Transformation.revive(result);
                        self.transformationSvc.changeTransformationObj(transformationObj);
                        if (paramMap.has('filestoreId')) {
                          this.showRdfMappingTab = true;
                          this.showTabularAnnotationTab = true;
                          this.showSaveButton = true;
                          this.showForkButton = true;
                          this.showDownloadButton = true;
                          this.showDeleteButton = true;
                          this.transformationSvc.changePreviewedTransformationObj(transformationObj);
                        }
                        else if (!paramMap.has('filestoreId')) {
                          this.showRdfMappingTab = true;
                          this.showTabularAnnotationTab = false;
                          if (this.messageSvc.getCurrentDataGraftState() == 'transformations.transformation') {
                            this.showSaveButton = true;
                            this.showForkButton = true;
                            this.showDownloadButton = true;
                            this.showDeleteButton = true;
                            this.showLoadDistributionDialog = true;
                          }
                        }
                      }
                    },
                    (error) => {
                      console.log(error);
                    });
              }
              else if (paramMap.has('publisher') && !paramMap.has('transformationId')) {
                this.showLoadDistributionDialog = true;
                this.showSaveButton = false;
                this.showForkButton = false;
                this.showDownloadButton = false;
                this.showDeleteButton = false;
              }
              // New transformation without publisher id, start oAuth process to identify user and redirect to route that includes publisher id
              else if (!paramMap.has('publisher')) {
                this.showRdfMappingTab = false;
                this.showTabularAnnotationTab = false;
                this.showSaveButton = true;
                this.showForkButton = false;
                this.showDownloadButton = false;
                this.showDeleteButton = false;
                this.dispatch.getAllTransformations('', false).then((result) => {
                  this.router.navigate([result[0].publisher, 'transformations', 'new', 'tabular-transformation']).then(() => this.showLoading = false);
                });
              }
            }
          });
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

  ngOnDestroy() {
    this.initRouteSubscription.unsubscribe();
  }

  onChange($event) {
    console.log(this.selectedFile);
  }

  loadDistribution() {
    this.dispatch.getAllFilestores().then((result) => {
      result.forEach((obj) => {
        this.distributionList.push({ label: obj.title, value: obj })
      });
      this.modalEnabled = true;
    });
  }

  onFileChange(event) {
    let reader = new FileReader();
    if (event.target.files && event.target.files.length > 0) {
      this.showLoading = true;
      this.showLoadDistributionDialog = false;
      let file = event.target.files[0];
      reader.readAsDataURL(file);
      reader.onload = () => {
        this.dispatch.uploadFile(file).subscribe((result) => {
          this.save(result.id);
          this.showLoading = false;
        });
      };
    }
  }

  accept() {
    this.save();
    this.showLoading = true;
    this.modalEnabled = false;
    this.showLoadDistributionDialog = false;
  }

  cancel() {
    this.modalEnabled = false;
    this.distributionList = [];
    this.selectedFile = undefined;
  }

  updatePreviewedData() {
    this.globalErrorRepSvc.changePreviewError(undefined);
    const paramMap = this.route.firstChild.snapshot.paramMap;

    if (paramMap.has('publisher') && paramMap.has('transformationId') && paramMap.has('filestoreId')) {
      const clojure = generateClojure.fromTransformation(this.previewedTransformationObj);
      this.transformationSvc.previewTransformation(paramMap.get('filestoreId'), clojure, 0, 100)
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
        .subscribe(
          (result) => {
            console.log('Successfully uploaded file!');
          },
          (error) => {
            console.log('Error uploading file!');
            console.log(error);
          });
    }
  }

  save(userUploadedFile?: any) {
    // Persist the transformation to DataGraft
    const paramMap = this.route.firstChild.snapshot.paramMap;
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
    if (!this.transformationObjSource.pipelines[0]) {
      this.transformationObjSource = new transformationDataModel.Transformation([], [], [new transformationDataModel.Pipeline([])], [], []);
    }
    const newTransformationConfiguration = {
      type: transformationType,
      command: transformationCommand,
      code: clojureCode,
      json: JSON.stringify(this.transformationObjSource)
    };
    if (paramMap.has('publisher') && paramMap.has('transformationId')) {
      return this.dispatch.updateTransformation(existingTransformationID,
        publisher,
        newTransformationName,
        isPublic,
        newTransformationDescription,
        newTransformationKeywords,
        newTransformationConfiguration).then(
          (result) => {
            console.log('Data uploaded');
            if (this.selectedFile == 'undefined') {
              this.router.navigate([result.publisher, 'transformations', result.id]).then(() => this.showLoading = false);
            }
            else {
              this.router.navigate([result.publisher, 'transformations', result.id, this.selectedFile.id, 'tabular-transformation']).then(() => {
                this.showLoading = false;
                this.distributionList = [];
              });
            }
          },
          (error) => {
            console.log('Error updating transformation');
            console.log(error);
          });
    }
    else if (paramMap.has('publisher') && !paramMap.has('transformationId')) {
      return this.dispatch.newTransformation(newTransformationName, false, newTransformationDescription, newTransformationKeywords,
        newTransformationConfiguration).then(
          (result) => {
            console.log('New transformation created');
            if (userUploadedFile) {
              this.router.navigate([result.publisher, 'transformations', result.id, userUploadedFile, 'tabular-transformation']).then(() => this.showLoading = false);
            }
            else if (this.selectedFile == undefined) {
              this.router.navigate([result.publisher, 'transformations', result.id]).then(() => this.showLoading = false);
            }
            else {
              this.router.navigate([result.publisher, 'transformations', result.id, this.selectedFile.id, 'tabular-transformation']).then(() => {
                this.showLoading = false;
                this.distributionList = [];
                this.selectedFile = undefined;
              });
            }
          },
          (error) => {
            console.log('Error creating new transformation');
            console.log(error);
          });
    }
  }

  fork() {
    // Fork (copy) the transformation from DataGraft
    const paramMap = this.route.firstChild.snapshot.paramMap;
    if (paramMap.has('transformationId') && paramMap.has('publisher')) {
      const publisher = paramMap.get('publisher');
      const existingTransformationID = paramMap.get('transformationId');
      console.log(publisher);
      console.log(existingTransformationID);

      return this.dispatch.forkTransformation(existingTransformationID, publisher).then(
        (result) => {
          console.log('Transformation forked');
          console.log(result);
          this.router.navigate([result["foaf:publisher"], 'transformations', result.id, 'tabular-transformation']).then(() => this.showLoading = false);
        },
        (error) => {
          console.log('Error forking transformation');
          console.log(error);
        });
    }
  }

  delete() {
    // Delete the transformation in DataGraft
    const paramMap = this.route.firstChild.snapshot.paramMap;
    if (paramMap.has('transformationId') && paramMap.has('publisher')) {
      const publisher = paramMap.get('publisher');
      const existingTransformationID = paramMap.get('transformationId');
      this.showConfirmDeleteDialog = false;
      return this.dispatch.deleteTransformation(existingTransformationID, publisher).then(
        (result) => {
          console.log('Transformation deleted');
        },
        (error) => {
          console.log('Error deleting transformation');
          console.log(error);
        });
    }
  }

  download() {
    if (this.downloadMode == 'csv') {
      this.downloadCSV();
    }
    else if (this.downloadMode == 'n-triples') {
      this.downloadTriples();
    }
    this.showDownloadDialog = false;
  }

  saveToFile(data, filename, MIMEtype) {
    var blob = new Blob([data], { type: MIMEtype }),
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

  downloadTriples(rdfFormat: string = 'nt') {
    this.save().then(
      () => {
        console.log('Data downloads');
        const paramMap = this.route.firstChild.snapshot.paramMap;
        if (paramMap.has('transformationId') && paramMap.has('filestoreId')) {
          const existingTransformationID = paramMap.get('transformationId');
          const filestoreID = paramMap.get('filestoreId');
          this.transformationSvc.transformFile(filestoreID, existingTransformationID, 'graft', rdfFormat).then(
            (transformed) => {
              this.saveToFile(transformed, 'triples.nt', 'application/n-triples');
            },
            (error) => {
              console.log('Error downloading file');
              console.log(error);
            }
          );
        }
      }
    );
  }

  downloadCSV() {
    this.save().then(
      () => {
        console.log('Data downloads');
        const paramMap = this.route.firstChild.snapshot.paramMap;
        if (paramMap.has('transformationId') && paramMap.has('filestoreId')) {
          const existingTransformationID = paramMap.get('transformationId');
          const filestoreID = paramMap.get('filestoreId');
          this.transformationSvc.transformFile(filestoreID, existingTransformationID, 'pipe-download').then(
            (transformed) => {
              this.saveToFile(transformed, 'data.csv', 'text/plain');
            },
            (error) => {
              console.log('Error downloading file');
              console.log(error);
            }
          );
        }
      }
    );
  }

  /**
   * Navigate to previous step of SPARQL endpoint creation wizard when embedded in DataGraft 
   */
  goBack() {
    this.messageSvc.setLocation(this.messageSvc.getPathBack());
  }


  /**
   * Navigate to last step of SPARQL endpoint creation wizard when embedded in DataGraft
   */
  goNextStep() {
    // fill wizard
    const paramMap = this.route.firstChild.snapshot.paramMap;
    if (paramMap.has('transformationId') && paramMap.has('filestoreId')) {
      const transformedFileName = paramMap.get('filestoreId');
      const transformationId = paramMap.get('transformationId');
      const wizardIdRegexMatch = transformedFileName.match(/^upwizards--(\d+)$/);
      const transformationType = 'graft'; // TODO this is hard-coded and will only work for RDF transformation wizards
      if (wizardIdRegexMatch) {
        this.loadingNextStepMessage = 'Computing transformation. Please wait...';
        this.fillingWizard = true;
        this.dispatch.fillDataGraftWizard(transformedFileName, transformationId, wizardIdRegexMatch[1], transformationType)
          .then((result) => {
            this.loadingNextStepMessage = 'Success! You will now be redirected to the next step...';
            // wait 5 seconds and close dialog?
            const location = '/myassets/upwizards/fill_sparql_endpoint/' + wizardIdRegexMatch[1];
            this.messageSvc.setLocation(location);
          }, (error) => {
            console.log(error);
            this.fillingWizard = false;
            this.loadingNextStepMessage = 'Error: Failed to compute the result of the transformation. Please try again.'
          });
      } else {
        // Error parsing the wizard ID - something
        throw ('Error! Unable to find wizard ID.');
      }
    } else {
      // Missing transformation ID or filestore ID
      throw ('Error! Unable to find transformation and/or file IDs.');
    }

    // on success fillingWizard = false; setLocation
    // on error fillingWizard = false
    // close dialog
    // this.showConfirmNextStepDialog = false;
    // set location to next step
  }

  cancelNextStep() {
    this.showConfirmNextStepDialog = false;
  }
  /**
   * Open confirmation dialog for contining the wizard when embedded in DataGraft
   */
  openNextStepConfirmation() {

    this.showConfirmNextStepDialog = true;
  }
}
