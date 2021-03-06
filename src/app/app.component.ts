import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { Http, Response, RequestOptions, Headers } from '@angular/http';
import 'rxjs/Rx';
import { SelectItem } from 'primeng/primeng';
import { Subscription } from 'rxjs';
import { AppConfig } from './app.config';
import { DispatchService } from './dispatch.service';
import { JarfterService } from './jarfter.service';
import { TransformationService } from './transformation.service';
import { DataGraftMessageService } from './data-graft-message.service';
import { RoutingService } from './routing.service';
import { GlobalErrorReportingService } from './global-error-reporting.service';
import { PipelineEventsService } from './tabular-transformation/pipeline-events.service';

import * as transformationDataModel from '../assets/transformationdatamodel.js';
import * as generateClojure from '../assets/generateclojure.js';
import { ArangoGeneratorService } from 'app/arango-generator.service';
import { TransformationUpdaterService } from 'app/transformation-updater.service';
import { ProgressIndicatorService } from 'app/progress-indicator.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [DispatchService, DataGraftMessageService]
})

export class AppComponent implements OnInit {

  loadingNextStepMessage: string;
  fillingWizard = false;
  grafterizerUrl: any = 'url';

  private nextStepDialogMessage = 'The result of this transformation will be saved in DataGraft';
  private downloadingResultDialogMessage = 'The result of this transformation will be saved in DataGraft';
  downloadingResult = false;

  private routingServiceSubscription: Subscription;
  private initRouteSubscription: Subscription;
  private updateDataRouteSubscription: Subscription;
  private progressIndicatorSubscription: Subscription;

  private previewedTransformationSubscription: Subscription;
  private previewedTransformationObj: any;

  private transformationObjSourceSubscription: Subscription;
  private transformationObjSource: any;

  private globalErrorSubscription: Subscription;
  globalErrors: Array<any>;

  private currentDataGraftStateSubscription: Subscription;
  private currentDataGraftState: string = 'unknown';
  private currentDataGraftParams: any;

  showWizardNavigation: boolean;
  downloadMode: string = 'rdf';

  distributionList: SelectItem[] = [];
  selectedFile: any;
  uiStateActive: string = 'ui-state-active';

  showConfirmNextStepDialog: boolean = false;
  showDownloadDialog: boolean = false;
  showConfirmDeleteDialog: boolean = false;
  showLoadDistributionMenu: boolean = false;
  showLoadExistingFileDialog: boolean = false;
  showTabularAnnotationTab: boolean = false;
  showChangeFileActions: boolean = false;
  showSaveButton: boolean = false;
  showForkButton: boolean = false;
  showDownloadButton: boolean = false;
  showDeleteButton: boolean = false;
  showLoading: boolean = false;
  showLogo: boolean = false;
  transformationType: string;
  chosenRdfFormatDownloadOption: string = 'nt';
  chosenJarFormatDownloadOption: string = 'nt';

  chosenEndpointURLOption: string = 'no-asia';
  asiaEndpointURL: string = '';

  constructor(private http: Http, public router: Router, private route: ActivatedRoute, private config: AppConfig,
    public dispatch: DispatchService, private jarfterSvc: JarfterService, private transformationSvc: TransformationService,
    public messageSvc: DataGraftMessageService, private routingService: RoutingService,
    private globalErrorRepSvc: GlobalErrorReportingService, private pipelineEventsSvc: PipelineEventsService
    , private arangoGeneratorSvc: ArangoGeneratorService, private transformationUpdaterSvc: TransformationUpdaterService, private progressIndicatorService: ProgressIndicatorService, ) {
    this.routingServiceSubscription = this.routingService.getMessage().subscribe(url => {
      this.grafterizerUrl = url;
    });
  }

  ngOnInit() {
    const self = this;
    this.currentDataGraftStateSubscription = this.messageSvc.currentDataGraftStateSrc.subscribe((state) => {
      if (state.mode) {
        this.currentDataGraftState = state.mode;
        switch (state.mode) {
          case 'transformations.transformation':
            this.showSaveButton = true;
            this.showForkButton = true;
            this.showDownloadButton = true;
            this.showDeleteButton = true;
            this.showLoadDistributionMenu = true;
            this.showWizardNavigation = false;
            break;
          case 'transformations.transformation.preview':
          case 'transformations.transformation.preview.wizard':
            this.showTabularAnnotationTab = true;
            this.showSaveButton = true;
            this.showForkButton = false;
            this.showDownloadButton = true;
            this.showDeleteButton = false;
            this.showLoadDistributionMenu = false;
            this.showWizardNavigation = true;
            break;
          case 'transformations.readonly':
            this.showSaveButton = false;
            this.showForkButton = false;
            this.showDownloadButton = false;
            this.showDeleteButton = false;
            this.showLoadDistributionMenu = false;
            this.showWizardNavigation = false;
            break;
          case 'transformations.new':
            this.showSaveButton = true;
            this.showForkButton = false;
            this.showDownloadButton = false;
            this.showDeleteButton = false;
            this.showLoadDistributionMenu = true;
            this.showWizardNavigation = false;
            break;
          case 'transformations.new.preview':
          case 'transformations.new.preview.wizard':
            this.showTabularAnnotationTab = true;
            this.showSaveButton = true;
            this.showForkButton = false;
            this.showDownloadButton = false;
            this.showDeleteButton = false;
            this.showLoadDistributionMenu = false;
            this.showWizardNavigation = true;
            break;
          case 'standalone':
            // TODO - this block is not really functional - fix next
            // check username - if none - determine it
            // also reroute to standalone new transformation mode
            this.showSaveButton = true;
            this.showForkButton = true;
            this.showDownloadButton = true;
            this.showDeleteButton = true;
            this.showLoadDistributionMenu = true;
            this.showWizardNavigation = false;
            this.showLogo = true;
            break;
          default:
            break;
        }
      }
      if (state.params) {
        this.currentDataGraftParams = state.params;
      }
    });

    if (this.currentDataGraftState == 'unknown') {
      this.messageSvc.refreshCurrentState();
    }
    this.initRouteSubscription = this.router.events.subscribe(
      (event) => {
        if (event instanceof NavigationEnd && self.route.firstChild != null) {
          const paramMap = self.route.firstChild.snapshot.paramMap;
          // start loading the data
          this.progressIndicatorService.changeDataLoadingStatus(true);
          if (paramMap.has('publisher') && paramMap.has('transformationId')) {
            // load the transformation
            self.dispatch.getTransformationJson(paramMap.get('transformationId'), paramMap.get('publisher'))
              .then(
                (result) => {
                  if (result !== 'Beginning OAuth Flow') {
                    // successfully got the JSON of the transformation
                    const transformationObj = transformationDataModel.Transformation.revive(result);
                    self.transformationSvc.transformationObjSource.next(transformationObj);
                    self.transformationUpdaterSvc.updateTransformationCustomFunctionDeclarations(transformationObj);
                    if (paramMap.has('filestoreId')) {
                      this.transformationSvc.previewedTransformationObjSource.next(transformationObj);
                    } else {
                      this.progressIndicatorService.changeDataLoadingStatus(false);
                    }
                  } else {
                    // we are beginning the OAuth flow, so we should start loading (not that it makes a huge difference)
                    this.progressIndicatorService.changeDataLoadingStatus(true);
                  }
                },
                (error) => {
                  console.log(error);
                  this.progressIndicatorService.changeDataLoadingStatus(false);
                });
          }
          // New transformation without publisher id, start oAuth process to identify user and redirect to route that includes publisher id
          else if (!paramMap.has('publisher')) {
            this.progressIndicatorService.changeDataLoadingStatus(true);
            this.dispatch.getAllTransformations('', false).then((result) => {
              if (result !== 'Beginning OAuth Flow') {
                this.createNewTransformation();
                this.progressIndicatorService.changeDataLoadingStatus(false);
              }
              else {
                console.log('error');
              }
            });
          }
          this.initRouteSubscription.unsubscribe();
        }
      });

    this.transformationObjSourceSubscription = this.transformationSvc.transformationObjSource
      .subscribe((transformationObjSource) => {
        this.transformationObjSource = transformationObjSource;
      });

    this.previewedTransformationSubscription = this.transformationSvc.previewedTransformationObjSource.subscribe((previewedTransformation) => {
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

    this.progressIndicatorSubscription = this.progressIndicatorService.currentGrafterizerLoadingStatus.subscribe((status) => {
      if (status == true || status == false) {
        this.showLoading = status;
      }
    });

    this.globalErrorSubscription = this.globalErrorRepSvc.globalErrorObs.subscribe((globalErrors) => {
      this.globalErrors = globalErrors;
    });
  }

  ngOnDestroy() {
    this.initRouteSubscription.unsubscribe();
    this.progressIndicatorSubscription.unsubscribe();
    this.globalErrorSubscription.unsubscribe();
    this.transformationObjSourceSubscription.unsubscribe();
    this.previewedTransformationSubscription.unsubscribe();
    this.currentDataGraftStateSubscription.unsubscribe();
  }

  onChange($event) {
  }

  loadDistribution() {
    this.distributionList = [];
    this.dispatch.getAllFilestores().then((result) => {
      result.forEach((obj) => {
        this.distributionList.push({ label: obj.title, value: obj })
      });
      this.showLoadExistingFileDialog = true;
      this.showChangeFileActions = true;
    });
  }

  onFileChange(event) {
    let reader = new FileReader();
    if (event.target.files && event.target.files.length > 0) {
      this.progressIndicatorService.changeDataLoadingStatus(true);
      this.showLoadDistributionMenu = false;
      let file = event.target.files[0];
      reader.readAsDataURL(file);
      reader.onload = () => {
        this.dispatch.uploadFile(file).subscribe((result) => {
          this.selectedFile = { id: result.id };
          this.save(true);
          this.showChangeFileActions = true;
        });
      };
    }
  }

  accept() {
    this.progressIndicatorService.changeDataLoadingStatus(true);
    this.save(true);
    this.showLoadExistingFileDialog = false;
    this.showLoadDistributionMenu = false;
  }

  cancel() {
    this.showLoadExistingFileDialog = false;
    this.selectedFile = undefined;
  }

  updatePreviewedData() {
    this.globalErrorRepSvc.changePreviewError(undefined);
    const paramMap = this.route.firstChild.snapshot.paramMap;

    if (paramMap.has('publisher') && paramMap.has('transformationId') && paramMap.has('filestoreId')) {
      const clojure = generateClojure.fromTransformation(this.previewedTransformationObj, false, "");
      this.transformationSvc.previewTransformation(paramMap.get('filestoreId'), clojure, 0, 10000)
        .then((result) => {
          this.transformationSvc.graftwerkDataSource.next(result);
        }, (err) => {
          this.globalErrorRepSvc.changePreviewError(err);
          this.transformationSvc.graftwerkDataSource.next(
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
          },
          (error) => {
            console.log('Error uploading file!');
            console.log(error);
          });
    }
  }

  save(redirect: boolean) {
    this.progressIndicatorService.changeGrafterizerLoadingStatus(true);
    // Persist the transformation to DataGraft
    const paramMap = this.route.firstChild.snapshot.paramMap;
    const publisher = paramMap.get('publisher');
    const existingTransformationID = paramMap.get('transformationId');
    const clojureCode = generateClojure.fromTransformation(this.transformationObjSource, false, "");
    let newTransformationName = null;
    let newTransformationDescription = null;
    let newTransformationKeywords = null;
    let isPublic = null;
    this.transformationSvc.transformationMetadata.subscribe((result) => {
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
      this.transformationObjSource = new transformationDataModel.Transformation([], [], [new transformationDataModel.Pipeline([])], [new transformationDataModel.Graph("http://example.com/", []), new transformationDataModel.Graph("http://example.com/", [])], []);
    }
    const newTransformationConfiguration = {
      type: transformationType,
      command: transformationCommand,
      code: clojureCode,
      json: JSON.stringify(this.transformationObjSource)
    };
    if (!redirect) {
      return this.dispatch.updateTransformation(existingTransformationID,
        publisher,
        newTransformationName,
        isPublic,
        newTransformationDescription,
        newTransformationKeywords,
        newTransformationConfiguration).then(
          (result) => {
            /** If we are editing a transformation, the address/slug of it may have changed (due to name change), so we need to change the URL in the browser */
            // if (this.currentDataGraftState == 'transformations.transformation.preview') {
            //   this.messageSvc.setLocationNoRedirect('/' + result.publisher + '/transformations/' + result.id + '/edit');
            // } else if (this.currentDataGraftState == 'transformations.transformation.preview.wizard') {
            //   this.messageSvc.setLocationNoRedirect('/' + result.publisher + '/transformations/' + result.id + '/edit');
            //   // what should happen here?
            // } else if (this.currentDataGraftState == 'transformations.new.preview.wizard') {
            //   this.messageSvc.setLocationNoRedirect('/' + result.publisher + '/transformations/' + result.id + '/edit');
            //   // should not happen
            //   // first save - change location to /[username]/upwizards/transform_select_preview/[wizard_id]?selected_id=[transformation_id]
            // } else {
            //   // should not happen
            //   this.messageSvc.setLocationNoRedirect('/' + result.publisher + '/transformations/' + result.id + '/edit');
            // }
            this.messageSvc.setLocationNoRedirect('/' + result.publisher + '/transformations/' + result.id + '/edit');
            this.dispatch.getTransformationJson(result.id, result.publisher)
              .then(
                (result) => {
                  const transformationObj = transformationDataModel.Transformation.revive(result);
                  this.transformationSvc.transformationObjSource.next(transformationObj);
                  this.progressIndicatorService.changeGrafterizerLoadingStatus(false);
                },
                (error) => {
                  this.progressIndicatorService.changeGrafterizerLoadingStatus(false);
                  console.log(error);
                });
          },
          (error) => {
            this.progressIndicatorService.changeGrafterizerLoadingStatus(false);
            console.log('Error updating transformation');
            console.log(error);
          });
    } else if (redirect) {
      this.saveAndRedirect(existingTransformationID, publisher, newTransformationName, isPublic, newTransformationDescription, newTransformationKeywords, newTransformationConfiguration);
    }
  }

  saveAndRedirect(existingTransformationID, publisher, newTransformationName, isPublic, newTransformationDescription, newTransformationKeywords, newTransformationConfiguration) {
    return this.dispatch.updateTransformation(existingTransformationID,
      publisher,
      newTransformationName,
      isPublic,
      newTransformationDescription,
      newTransformationKeywords,
      newTransformationConfiguration).then(
        (result) => {
          this.messageSvc.setLocationNoRedirect('/' + result.publisher + '/transformations/' + result.id + '/edit');
          if (this.selectedFile == undefined) {
            this.router.navigate([result.publisher, 'transformations', result.id]).then(() => {
              this.dispatch.getTransformationJson(result.id, result.publisher)
                .then(
                  (result) => {
                    const transformationObj = transformationDataModel.Transformation.revive(result);
                    this.transformationSvc.transformationObjSource.next(transformationObj);
                    this.transformationSvc.previewedTransformationObjSource.next(transformationObj);
                    this.progressIndicatorService.changeGrafterizerLoadingStatus(false);
                    this.progressIndicatorService.changeDataLoadingStatus(false);
                  },
                  (error) => {
                    this.progressIndicatorService.changeGrafterizerLoadingStatus(false);
                    console.log(error);
                  });
            });
          } else {
            this.router.navigate([result.publisher, 'transformations', result.id, this.selectedFile.id, 'tabular-transformation']).then(() => {
              this.dispatch.getTransformationJson(result.id, result.publisher)
                .then(
                  (result) => {
                    const transformationObj = transformationDataModel.Transformation.revive(result);
                    this.transformationSvc.transformationObjSource.next(transformationObj);
                    this.showTabularAnnotationTab = true;
                    this.showSaveButton = true;
                    this.showForkButton = true;
                    this.showDownloadButton = true;
                    this.showDeleteButton = true;
                    this.transformationSvc.previewedTransformationObjSource.next(transformationObj);
                    this.progressIndicatorService.changeGrafterizerLoadingStatus(false);
                  },
                  (error) => {
                    this.progressIndicatorService.changeGrafterizerLoadingStatus(false);
                    console.log(error);
                  });
            });
          }
        },
        (error) => {
          this.progressIndicatorService.changeGrafterizerLoadingStatus(false);
          console.log('Error updating transformation');
          console.log(error);
        });
  }

  createNewTransformation(distributionID?: string) {
    this.transformationObjSource = new transformationDataModel.Transformation([], [], [new transformationDataModel.Pipeline([])], [new transformationDataModel.Graph("http://example.com/", []), new transformationDataModel.Graph("http://example.com/", [])], []);
    this.transformationUpdaterSvc.updateTransformationCustomFunctionDeclarations(this.transformationObjSource);
    const clojureCode = generateClojure.fromTransformation(this.transformationObjSource, false, "");
    let transformationType = 'graft';
    let transformationCommand = 'my-graft';

    const newTransformationConfiguration = {
      type: transformationType,
      command: transformationCommand,
      code: clojureCode,
      json: JSON.stringify(this.transformationObjSource)
    };
    return this.dispatch.newTransformation(null, false, null, null,
      newTransformationConfiguration).then(
        (result) => {
          if (this.currentDataGraftParams.distributionId) {
            // can this be reached? (we only have a distribution ID when creating a new transformation from the wizard)
            this.dispatch.getTransformation(result.publisher, result.id).then(
              (result) => {
                const wizardIdRegexMatch = this.currentDataGraftParams.distributionId.match(/^upwizards--(\d+)$/);
                if (!wizardIdRegexMatch[1]) {
                  throw "Error creating a new transformation. Could not find wizard identifier.";
                }
                if (!result['internal_id']) {
                  throw "Error creating a new transformation. Could not find internal identifier of transformation.";
                }
                this.messageSvc.setLocation('/' + result.publisher + '/upwizards/transform_select_preview/' + wizardIdRegexMatch[1] + '?selected_id=' + result['internal_id']);
              },
              (error) => {
                console.log(error);
              });
            this.router.navigate([result.publisher, 'transformations', result.id, this.currentDataGraftParams.distributionId, 'tabular-transformation']).then(() => {
              this.updatePreviewedData();
              this.progressIndicatorService.changeDataLoadingStatus(false);
            });
          } else {
            this.router.navigate([result.publisher, 'transformations', result.id, 'tabular-transformation']).then(() => {
              this.messageSvc.setLocation('/' + result.publisher + '/transformations/' + result.id + '/edit');
              this.progressIndicatorService.changeDataLoadingStatus(false);
            });
          }
        },
        (error) => {
          console.log('Error creating new transformation');
          console.log(error);
        });
  }

  fork() {
    // Fork (copy) the transformation from DataGraft
    const paramMap = this.route.firstChild.snapshot.paramMap;
    if (paramMap.has('transformationId') && paramMap.has('publisher')) {
      const publisher = paramMap.get('publisher');
      const existingTransformationID = paramMap.get('transformationId');
      return this.dispatch.forkTransformation(existingTransformationID, publisher).then(
        (result) => {
          this.messageSvc.setLocationNoRedirect('/' + result["foaf:publisher"] + '/transformations/' + result.id + '/edit');
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
          this.messageSvc.setLocation('/dashboard');
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
    else if (this.downloadMode == 'rdf') {
      this.downloadTriples(this.chosenRdfFormatDownloadOption);
    } else if (this.downloadMode == 'arango-json') {
      this.downloadArangoJson();
    } else if (this.downloadMode == 'grafterizer-json') {
      this.downloadGrafterizerJson();
    }
    else if (this.downloadMode == 'jar') {
      this.downloadJAR();
    }
    this.showDownloadDialog = false;
  }
  downloadGrafterizerJson(): any {
    this.save(false).then(
      () => {
        const paramMap = this.route.firstChild.snapshot.paramMap;
        if (paramMap.has('publisher') && paramMap.has('transformationId')) {
          this.dispatch.getLegacyTransformationJson(paramMap.get('transformationId'), paramMap.get('publisher'))
            .then((result) => {
              this.saveToFile(JSON.stringify(result), 'transformation.json', 'application/json');
            },
              (error) => {
                // TODO throw exception?
                console.log('Error loading transformation from backend');
                console.log(error)
              })
        } else {
          console.log('Error getting transformation JSON. Missing publisher and transformation ID');
          // TODO throw exception?
        }
      });
  }

  downloadArangoJson(): any {
    // this.
    this.save(false).then(
      () => {
        const paramMap = this.route.firstChild.snapshot.paramMap;
        if (paramMap.has('transformationId') && paramMap.has('filestoreId')) {
          const existingTransformationID = paramMap.get('transformationId');
          const filestoreID = paramMap.get('filestoreId');
          this.transformationSvc.transformFile(filestoreID, existingTransformationID, 'pipe-download').then(
            (transformed) => {

              let inputCsv = new Blob([transformed], { type: 'text/csv' });
              let inputCsvFile = new File([inputCsv], 'input.csv');
              this.arangoGeneratorSvc.getArangoCollections(inputCsvFile, { extra: this.transformationObjSource })
                .then((arangoJsonZIP) => {
                  this.saveToFile(arangoJsonZIP, 'arango-json.zip', 'application/zip');
                },
                  (error) => {
                    console.log('Error retrieving ArangoDB JSON');
                    console.log(error);
                  });
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
    this.save(false).then(
      () => {
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
    this.save(false).then(
      () => {
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

  downloadJAR() {
    var form = document.createElement('form');

    form.action = this.jarfterSvc.getJarCreatorStandAloneEndpoint();
    form.method = 'POST';
    form.target = '_blank';
    form.style.display = 'none';
    var input = document.createElement('input');
    input.type = 'text';
    input.name = 'clojure';
    var isCsv = false;
    if (this.chosenJarFormatDownloadOption == 'csv') {
      isCsv = true;
    }
    input.value = this.jarfterSvc.generateClojure(this.transformationObjSource, isCsv, this.chosenEndpointURLOption === 'no-asia' ? "no-asia" : this.asiaEndpointURL);
    var submit = document.createElement('input');
    submit.type = 'submit';
    submit.id = 'submitProject';
    form.appendChild(input);
    form.appendChild(submit);
    document.body.appendChild(form);
    document.getElementById('submitProject').click();
    document.body.removeChild(form);
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
      if (wizardIdRegexMatch) {
        this.loadingNextStepMessage = 'Computing transformation. Please wait...';
        this.fillingWizard = true;
        this.dispatch.fillDataGraftWizard(transformedFileName, transformationId, wizardIdRegexMatch[1], this.transformationType)
          .then((result) => {
            this.loadingNextStepMessage = 'Success! You will now be redirected to the next step...';
            // wait 5 seconds and close dialog?
            const wizardPath = this.transformationType == 'pipe' ? 'fill_filestore' : 'fill_sparql_endpoint';
            const location = '/myassets/upwizards/' + wizardPath + '/' + wizardIdRegexMatch[1];
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
