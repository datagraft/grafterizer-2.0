import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef, MatPaginator, MatTableDataSource, Sort } from '@angular/material';
import { EnrichmentService } from '../enrichment.service';
import { ConciliatorService, QueryResult, Result, Type } from '../enrichment.model';
import { AddEntityDialogComponent } from './addEntityDialog.component';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { AnnotationService } from '../../annotation.service';
import { Annotation } from '../../annotation.model';
import { Observable, Subscription } from 'rxjs';
import { AsiaMasService } from '../../asia-mas/asia-mas.service';
import { CustomValidators } from '../../shared/custom-validators';
import * as transformationDataModel from 'assets/transformationdatamodel.js';
import { TransformationService } from 'app/transformation.service';
import { UrlUtils } from 'app/tabular-annotation/shared/url-utils';

@Component({
  selector: 'app-reconciliation',
  templateUrl: './reconciliation.component.html',
  styleUrls: ['./reconciliation.component.css']
})
export class ReconciliationComponent implements OnInit {
  constructor(private fb: FormBuilder, public dialogRef: MatDialogRef<ReconciliationComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogInputData: any, public dialog: MatDialog, public annotationService: AnnotationService,
    private enrichmentService: EnrichmentService,
    private suggesterSvc: AsiaMasService, public transformationSvc: TransformationService) {
  }

  public close = false;
  public colIndex: any;
  public filter_column = 0;
  public change_selected = false;
  public index_filtered_reconciled = 0;
  public index_added: number;
  public temp_option: string;
  public temp_score: number;
  public temp_link: string;
  public temp_match: boolean;
  public form_hidden = false;
  public selected = -1;
  public displayedColumns: string[];
  public dataSource = null;
  public dataSource_2 = null;
  public header: any;
  public reconciledData: QueryResult[];
  public reconciledDataFiltered = null;
  public selectedGroup: any;
  public selectedServiceId: string;
  private selectedServiceObject: ConciliatorService;
  public services: Map<string, ConciliatorService>;
  public newColumnName: string;

  guessedType: Type;
  guessedTypeSchemaSpace: string;

  public showPreview: boolean;
  public dataLoading: boolean;
  public servicesGroups: string[];
  public servicesForSelectedGroup: ConciliatorService[];
  public threshold: number;
  public skippedCount: number;
  public matchedCount: number;
  public maxThresholdCount: number;
  public notReconciledCount: number;
  public shiftColumn = false;
  public manualMatched: any[] = [];
  public reconciliationForm: FormGroup;
  public items: FormArray;
  public property: string;
  public value: string;
  public propertyArray: string[] = [];
  public sourceArray: string[] = [];
  public reconcileWithProperties = false;

  private transformationObj: any;

  private currentReconciliation: any;

  private currentAnnotation: any;
  private transformationSubscription: Subscription;

  private manualMatches: Map<string, string>;
  private automaticMatches: Map<string, string>;


  private enrichmentServicesListSubscription: Subscription;
  private reconciliationServicesMapSubscription: Subscription;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  public available: string[];
  public index: number;
  filteredOptions: string[];


  ngOnInit() {
    this.header = this.dialogInputData.header;
    this.colIndex = this.dialogInputData.indexCol;
    this.services = new Map();
    this.manualMatches = new Map<string, string>();
    this.automaticMatches = new Map<string, string>();
    this.servicesGroups = [];
    this.guessedTypeSchemaSpace = '';

    this.reconciliationServicesMapSubscription = this.enrichmentService.reconciliationServicesMapSource
      .subscribe((serviceMap) => {
        this.services = serviceMap;
        if (serviceMap.size) {
          let servicesGroupsSet = new Set<string>();
          serviceMap.forEach((svc) => {
            servicesGroupsSet.add(svc.getGroup());
          });
          this.servicesGroups = Array.from(servicesGroupsSet.keys());
        }
      });

    // only invoke listing once to initialise the list of services - this should never happen as the list would normally already be initialized from the Tabular Annotation component
    if (!this.services.size) {
      // retrieve services using request
      this.enrichmentServicesListSubscription = this.enrichmentService.listServices().subscribe((data) => {
        let tmpServices = new Map<string, ConciliatorService>();

        Object.keys(data).forEach((serviceCategory) => {
          data[serviceCategory].forEach((service) => {
            tmpServices.set(service['id'], new ConciliatorService({ ...service, ...{ 'group': serviceCategory } }));
          });
          this.servicesGroups.push(serviceCategory);
        });
        // update the behavior object containing services
        this.enrichmentService.reconciliationServicesMapSource.next(tmpServices);
      });
    }

    this.transformationSubscription =
      this.transformationSvc.transformationObjSource.subscribe((transformationObj) => {
        this.transformationObj = transformationObj;
        if (!this.dialogRef) return;

        // Note: we assume a single annotation is associated with a reconciled column (although multiple are supported by the TransformationDataModel)
        this.currentAnnotation = this.transformationObj.getAnnotationForReconciledColumn(this.header);
        if (this.currentAnnotation) {
          // we have an existing annotation
          this.currentReconciliation = this.currentAnnotation.reconciliation;
          if (this.currentReconciliation) {
            // annotation has been made through reconciliation
            this.threshold = this.currentReconciliation.threshold;
            this.showPreview = true;

            let i = 0;
            // load automatic and manual matches
            for (i = 0; i < this.currentReconciliation.automaticMatches.length; ++i) {
              this.automaticMatches.set(this.currentReconciliation.automaticMatches[i].valuesToMatch[0], this.currentReconciliation.automaticMatches[i].match[0]);

            }
            if (this.currentReconciliation.manualMatches instanceof Array) {
              for (i = 0; i < this.currentReconciliation.manualMatches.length; ++i) {
                this.manualMatches.set(this.currentReconciliation.manualMatches[i].valuesToMatch[0], this.currentReconciliation.manualMatches[i].match[0]);
              }
            } else {

              this.currentReconciliation.manualMatches = [this.currentReconciliation.manualMatches ? this.currentReconciliation.manualMatches : ""];
            }
            this.reconciliationForm = this.fb.group({
              selectedGroup: new FormControl(''),
              selectedService: new FormControl(''),
              items: this.fb.array([this.createNewItem()]),
              newColumnName: new FormControl(this.currentAnnotation.columnName),
              shiftColumn: new FormControl('')
            });

            // if list of services has been initialized - choose a service automatically for the loaded reconciliation
            if (this.services.size) {
              this.guessedType = new Type(this.currentReconciliation.inferredTypes[0]);
              this.selectedServiceObject = this.services.get(this.currentAnnotation.conciliatorServiceName);
              this.guessedTypeSchemaSpace = this.selectedServiceObject.getSchemaSpace();
              if (this.selectedServiceObject) {
                this.selectedGroup = this.selectedServiceObject.getGroup();
                this.selectedServiceId = this.selectedServiceObject.getId();

                this.reconciliationForm.get('selectedGroup').setValue(this.selectedGroup);
                this.updateServicesForSelectedGroup();
                this.reconciliationForm.get('selectedService').setValue(this.selectedServiceId);
              }
              this.dataLoading = true;
              // recover previously reconciled data
              // TODO hanging subscription
              this.enrichmentService.reconcileColumn(this.header, this.propertyArray, this.sourceArray, this.services.get(this.selectedServiceId))
                .subscribe((data) => {
                  this.reconciledData = data;

                  this.reconciledData.forEach((mapping) => {
                    mapping.results = mapping.results.filter((result) => {
                      const filteredResults = result.types.filter((type) => {
                        return type.id === this.guessedType.id;
                      });
                      return filteredResults.length > 0;
                    });
                  });
                  for (i = 0; i < this.reconciledData.length; ++i) {
                    let currentMatch = this.automaticMatches.get(this.reconciledData[i].reconciliationQuery.getQuery());
                    if (!currentMatch) {
                      currentMatch = this.manualMatches.get(this.reconciledData[i].reconciliationQuery.getQuery());
                    }
                    if (currentMatch) {
                      // set the detected match from the current reconciliation
                      let tmpResult = Object.assign([], this.reconciledData[i].results[0]);
                      this.reconciledData[i].results.push(new Result(tmpResult));
                      this.reconciledData[i].results[0].name = this.reconciledData[i].reconciliationQuery.getQuery();
                      this.reconciledData[i].results[0].score = 1;
                      this.reconciledData[i].results[0].id = currentMatch;
                      this.reconciledData[i].results[0].match = true;
                    }
                  }
                  this.displayedColumns = [this.header].concat(this.sourceArray).concat(['reconciled_entity', 'set matching']);
                  this.dataSource = new MatTableDataSource(this.reconciledData); // to use material filter
                  this.dataSource_2 = data; // to update reconciledData
                  this.dataSource.paginator = this.paginator;
                  this.reconciledDataFiltered = Object.assign([], this.reconciledData);
                  this.updateThreshold();
                  this.dataLoading = false;
                });
            }
          }

        } else {
          this.showPreview = false;
          this.threshold = 0.8;

          this.skippedCount = 0;
          this.matchedCount = 0;
          this.reconciledData = [];
          this.maxThresholdCount = 0;
          this.notReconciledCount = 0;
          this.dataLoading = false;
          this.reconciliationForm = this.fb.group({
            selectedGroup: new FormControl(''),
            selectedService: new FormControl(''),
            items: this.fb.array([this.createNewItem()]),
            newColumnName: new FormControl(''),
            shiftColumn: new FormControl('')
          });
        }
      });

    this.fillAllowedSourcesArray();
    // TODO index of what???
    this.index = 0;
  }

  ngOnDestroy() {
    this.transformationSubscription.unsubscribe();
    if (this.enrichmentServicesListSubscription) {
      this.enrichmentServicesListSubscription.unsubscribe();
    }
    if (this.reconciliationServicesMapSubscription) {
      this.reconciliationServicesMapSubscription.unsubscribe();
    }
  }

  createNewItem(): FormGroup {
    return new FormGroup({
      sourceColumn: new FormControl('', [
        CustomValidators.columnValidator(this.available),
        CustomValidators.uniqueSourceValidator('sourceColumn')
      ]),
      property: new FormControl('', CustomValidators.URLValidator())
    }, CustomValidators.subjectPropertyValidator('sourceColumn', 'property', undefined));
  }

  addItem(index: number): void {
    (this.reconciliationForm.get('items') as FormArray).insert(index + 1, this.createNewItem());
  }

  deleteItem(index: number): void {
    (this.reconciliationForm.get('items') as FormArray).removeAt(index);
  }

  fillAllowedSourcesArray() {
    this.available = this.annotationService.headers.filter(s => s !== this.header);
    this.filteredOptions = this.available;
  }


  /**
   * Remove empty/wrong groups from the array while filling the source and property arrays
   */
  filterEmptySelect() {
    const formArray = (this.reconciliationForm.get('items') as FormArray);

    // Remove empty/wrong groups from the array while filling the source and property arrays
    formArray.controls = formArray.controls.filter((ctrl: FormGroup) => {
      if (ctrl.get('sourceColumn').value !== '' && ctrl.get('property').value !== '') {
        this.sourceArray.push(ctrl.get('sourceColumn').value);
        this.propertyArray.push(ctrl.get('property').value);
        return true;
      }
      return false;
    });

    if (formArray.controls.length === 0) {
      formArray.controls = [this.createNewItem()];
    }
  }

  public reconcile() {
    this.propertyArray = [];
    this.sourceArray = [];
    this.skippedCount = 0;
    this.matchedCount = 0;
    this.maxThresholdCount = 0;
    this.notReconciledCount = 0;
    this.dataLoading = true;
    this.showPreview = true;
    // TODO hanging subscription!
    this.enrichmentService.reconcileColumn(this.header, this.propertyArray, this.sourceArray,
      this.services.get(this.reconciliationForm.get('selectedService').value)).subscribe((data: QueryResult[]) => {
        this.reconciledData = data;
        this.displayedColumns = [this.header].concat(this.sourceArray).concat(['reconciled_entity', 'set matching']);
        this.dataSource = new MatTableDataSource(this.reconciledData); // to use material filter
        this.dataSource_2 = this.reconciledData; // to update reconciledData
        this.dataSource.paginator = this.paginator;
        this.reconciledDataFiltered = Object.assign([], this.reconciledData);
        this.guessedType = this.enrichmentService.getMostFrequentType(this.reconciledData);

        this.reconciledData.forEach((mapping: QueryResult) => {
          mapping.results = mapping.results
            .filter((result: Result) => result.types
              .filter((type: Type) => type.id === this.guessedType.id).length > 0);
        });

        this.updateThreshold();
        this.dataLoading = false;

      });
  }

  isValidUrl(string): boolean {
    try {
      const url = new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  public applyReconciliation() {

    // create reconciliation with values for threshold, etc.
    // create new annotation and attach reconciliation
    // submit changes of transformation

    // set the name of the new column based on user input (or lack thereof)
    if (!this.reconciliationForm.get('newColumnName').value || this.reconciliationForm.get('newColumnName').value.trim().length === 0) {
      this.reconciliationForm.get('newColumnName').setValue(this.header + '_' + this.reconciliationForm.get('selectedService').value);
    }
    this.reconciliationForm.get('newColumnName').setValue(this.reconciliationForm.get('newColumnName').value.replace(/\s/g, '_'));
    let newColumnName = this.reconciliationForm.get('newColumnName').value;

    // initialize the column reconciliation
    let multiColumnReconciliationFormControls = (this.reconciliationForm.get('items') as FormArray).controls
    if (multiColumnReconciliationFormControls.length > 0 && this.reconcileWithProperties) {
      this.currentReconciliation = new transformationDataModel.MultiColumnReconciliation(this.header, this.threshold, [], [], [], []);
      this.filterEmptySelect();
    } else {
      this.currentReconciliation = new transformationDataModel.SingleColumnReconciliation(this.header, this.threshold, [this.guessedType], [], []);
    }

    // add the automatic and manual matches to the respective arrays
    this.sourceArray;
    let manualMatchesArray = [];
    Array.from(this.manualMatches).forEach((manualMatchPair) => {
      let match = new transformationDataModel.MatchPair([manualMatchPair[0]], [manualMatchPair[1]]);
      manualMatchesArray.push(match);
    });

    let automaticMatchesArray = [];
    Array.from(this.automaticMatches).forEach((manualMatchPair) => {
      let match = new transformationDataModel.MatchPair([manualMatchPair[0]], [manualMatchPair[1]]);
      automaticMatchesArray.push(match);
    });

    this.currentReconciliation.manualMatches = manualMatchesArray;
    this.currentReconciliation.automaticMatches = automaticMatchesArray;

    // determine the type of the new annotation
    let newAnnotationType;
    if (this.isValidUrl(this.guessedType.id)) {
      // in the case where the ID is not from the identifier space of the conciliator service
      const namespace = UrlUtils.getNamespaceFromURL(new URL(this.guessedType.id));
      const shortType = this.guessedType.id.substr(UrlUtils.getNamespaceFromURL(new URL(this.guessedType.id)).length);
      newAnnotationType = new transformationDataModel.ConstantURI(
        this.annotationService.getPrefixForNamespace(namespace, this.transformationObj), // prefix
        shortType // short name
        , [], []);
    } else {
      newAnnotationType = new transformationDataModel.ConstantURI(
        this.annotationService.getPrefixForNamespace(this.services.get(this.reconciliationForm.get('selectedService').value).getSchemaSpace(), this.transformationObj), // prefix
        this.guessedType.id // short name
        , [], []);
    }


    this.selectedServiceObject = this.services.get(this.reconciliationForm.get('selectedService').value);

    // determine the prefix for URIfication of the column data for the new annotation
    let urifyPrefix = this.annotationService.getPrefixForNamespace(
      this.selectedServiceObject.getIdentifierSpace(),
      this.transformationObj);

    let extensions = [];
    let newColumnAnnotationId = 0;
    let subjectAnnotationId = 0;
    let properties = [];
    if (this.currentAnnotation) {
      newColumnAnnotationId = this.currentAnnotation.id;
      extensions = this.currentAnnotation.extensions || [];
      subjectAnnotationId = this.currentAnnotation.subjectAnnotationId;
      properties = this.currentAnnotation.properties;
    } else {
      newColumnAnnotationId = this.transformationObj.getUniqueId();
    }

    let newColumnAnnotation = new transformationDataModel.URINodeAnnotation(
      newColumnName,
      subjectAnnotationId, // there is no subject yet
      properties, // there are no properties
      [newAnnotationType], // the type is the guessed type
      urifyPrefix, // we use the just created URIfy prefix
      false, // this is not a subject yet
      'valid', // annotation is not subject or object but has a type
      newColumnAnnotationId,
      this.selectedServiceObject.getId(), // we assign the conciliator name as the so called 'ID' of the selected one
      extensions, // no extensions yet
      this.currentReconciliation // current reconciliation
    );

    // add or replace annotation in the transformation object
    this.transformationObj.addOrReplaceAnnotation(newColumnAnnotation);

    this.dialogRef.close();
    // we set this to null so we know when the dialog is closed (not to trigger the subscription for the transformation loading)
    this.dialogRef = null;

    // store changes in the transformation object
    this.transformationSvc.transformationObjSource.next(this.transformationObj);
    this.transformationSvc.previewedTransformationObjSource.next(this.transformationObj);
  }

  updateServicesForSelectedGroup(): void {
    this.servicesForSelectedGroup = Array.from(this.services.values()).filter(
      s => s.getGroup() === this.reconciliationForm.get('selectedGroup').value);
    this.reconciliationForm.get('selectedGroup').setValue(this.servicesForSelectedGroup[0].getGroup());
    // this.showPreview = false;
  }

  updateThreshold() {
    this.skippedCount = 0;
    this.matchedCount = 0;
    this.maxThresholdCount = 0;
    this.notReconciledCount = 0;
    if (this.threshold != null) {
      if (this.threshold < 0) {
        this.threshold = 0;
      }
      if (this.threshold > 1) {
        this.threshold = 1;
      }
    } else { // when the input is not a number
      this.threshold = 0.8;
    }
    this.threshold = parseFloat(this.threshold.toFixed(2));


    this.reconciledData.forEach((mapping: QueryResult) => {
      if (mapping.results.length > 0) {
        if (mapping.results[0].match && this.manualMatched.indexOf(mapping.results[0].id) === -1) {
          this.matchedCount += 1;
        } else if (!mapping.results[0].match && mapping.results[0].score < this.threshold) {
          this.skippedCount += 1;
        } else if (!mapping.results[0].match && mapping.results[0].score >= this.threshold) {
          this.maxThresholdCount += 1;
        }
      } else if (mapping.results.length === 0) {
        this.notReconciledCount += 1;
      }
    });
  }

  setManualMatchFromSelection(index, selectedOptionIndex) {
    if (selectedOptionIndex !== 0) {
      this.manualMatched.push(this.dataSource_2[index].results[selectedOptionIndex].id);

      this.manualMatches.delete(this.dataSource_2[index].reconciliationQuery.query);
      this.manualMatches.set(this.dataSource_2[index].reconciliationQuery.query, this.dataSource_2[index].results[selectedOptionIndex].id);

      this.temp_option = this.dataSource_2[index].results[0].name;
      this.temp_score = this.dataSource_2[index].results[0].score;
      this.temp_link = this.dataSource_2[index].results[0].id;
      this.temp_match = this.dataSource_2[index].results[0].match;

      this.dataSource_2[index].results[0].name = this.dataSource_2[index].results[selectedOptionIndex].name;
      this.dataSource_2[index].results[0].score = this.dataSource_2[index].results[selectedOptionIndex].score;
      this.dataSource_2[index].results[0].id = this.dataSource_2[index].results[selectedOptionIndex].id;
      this.dataSource_2[index].results[0].match = true;

      this.dataSource_2[index].results[selectedOptionIndex].name = this.temp_option;
      this.dataSource_2[index].results[selectedOptionIndex].score = this.temp_score;
      this.dataSource_2[index].results[selectedOptionIndex].id = this.temp_link;
      this.dataSource_2[index].results[selectedOptionIndex].match = this.temp_match;
      if (this.change_selected) {
        this.selected = -4;
        this.change_selected = false;
      } else {
        this.selected = -3;
        this.change_selected = true;
      }
    }
    this.updateThreshold();
    this.apply_column_filter(this.filter_column);
  } // end set_reconcilied

  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  } // end applyFilter

  hide_form() {
    this.form_hidden = true;
  } // end hide_form

  show_form() {
    this.form_hidden = false;
  } // end show_form

  openAddEntityDialog(row_index: number): void {
    const dialogRef = this.dialog.open(AddEntityDialogComponent, {
      width: '600px',
      data: { 'identifierSpace': this.services.get(this.reconciliationForm.get('selectedService').value).getIdentifierSpace() }
    });
    // TODO hanging subscription
    dialogRef.afterClosed().subscribe(result => {
      if (result && result['id'] && result['name']) {
        while (this.dataSource_2[row_index].results.length >= 5) {
          this.dataSource_2[row_index].results.splice(4, 1);
        }
        this.dataSource_2[row_index].results.push({
          id: result.id, name: result.name, types: null, score: 1, match: true
        });

        this.index_added = this.dataSource_2[row_index].results.length - 1;
        this.setManualMatchFromSelection(row_index, this.index_added);
        this.apply_column_filter(this.filter_column);
      }
    }); // dialogRef
  } // end openAddEntityDialog

  apply_column_filter(filter: number) {
    this.index_filtered_reconciled = 0;
    this.reconciledDataFiltered = Object.assign([], this.reconciledData);

    if (filter === 0) { // no filter
      this.dataSource = new MatTableDataSource(this.reconciledData); // to use material filter
      this.dataSource_2 = this.reconciledData; // to update reconciledData
      this.dataSource.paginator = this.paginator;
    } else if (filter === 1) { // filter by matched
      this.reconciledData.forEach((mapping: QueryResult) => {
        if ((mapping.results.length > 0 &&
          (!mapping.results[0].match || this.manualMatched.indexOf(mapping.results[0].id) !== -1)) || mapping.results.length === 0) {
          this.reconciledDataFiltered.splice(this.index_filtered_reconciled, 1);
          this.index_filtered_reconciled--;
        }
        this.index_filtered_reconciled++;

      });
      this.dataSource = new MatTableDataSource(this.reconciledDataFiltered); // to use material filter
      this.dataSource_2 = this.reconciledDataFiltered;
      this.dataSource.paginator = this.paginator;
    } else if (filter === 2) { // filter by >= threshold
      this.reconciledData.forEach((mapping: QueryResult) => {
        if ((mapping.results.length > 0 &&
          (mapping.results[0].match || mapping.results[0].score < this.threshold)) || mapping.results.length === 0) {
          this.reconciledDataFiltered.splice(this.index_filtered_reconciled, 1);
          this.index_filtered_reconciled--;
        }
        this.index_filtered_reconciled++;
      });
      this.dataSource = new MatTableDataSource(this.reconciledDataFiltered); // to use material filter
      this.dataSource_2 = this.reconciledDataFiltered;
      this.dataSource.paginator = this.paginator;
    } else if (filter === 3) { // filter by < threshold
      this.reconciledData.forEach((mapping: QueryResult) => {
        if ((mapping.results.length > 0 && mapping.results[0].score >= this.threshold) || mapping.results.length === 0) {
          this.reconciledDataFiltered.splice(this.index_filtered_reconciled, 1);
          this.index_filtered_reconciled--;
        }
        this.index_filtered_reconciled++;
      });
      this.dataSource = new MatTableDataSource(this.reconciledDataFiltered); // to use material filter
      this.dataSource_2 = this.reconciledDataFiltered;
      this.dataSource.paginator = this.paginator;
    } else if (filter === 4) { // filter by not reconciled
      this.reconciledData.forEach((mapping: QueryResult) => {
        if (mapping.results.length > 0) {
          this.reconciledDataFiltered.splice(this.index_filtered_reconciled, 1);
          this.index_filtered_reconciled--;
        }
        this.index_filtered_reconciled++;
      });
      this.dataSource = new MatTableDataSource(this.reconciledDataFiltered); // to use material filter
      this.dataSource_2 = this.reconciledDataFiltered;
      this.dataSource.paginator = this.paginator;
    } else if (filter === 5) { // filter by matched by user
      this.reconciledData.forEach((mapping: QueryResult) => {
        if ((mapping.results.length > 0 && this.manualMatched.indexOf(mapping.results[0].id) === -1) || mapping.results.length === 0) {
          this.reconciledDataFiltered.splice(this.index_filtered_reconciled, 1);
          this.index_filtered_reconciled--;
        }
        this.index_filtered_reconciled++;
      });
      this.dataSource = new MatTableDataSource(this.reconciledDataFiltered); // to use material filter
      this.dataSource_2 = this.reconciledDataFiltered;
      this.dataSource.paginator = this.paginator;
    } // end filter 4
  } // end apply_column_filter

  sortData(sort: Sort) {
    const data = this.reconciledData.slice();
    if (!sort.active || sort.direction === '') {
      this.reconciledData = data;
      return;
    }

    this.reconciledData = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      if (a.results.length > 0 && b.results.length > 0) {
        return this.compare(a.results[0].score, b.results[0].score, isAsc);

      } else if (a.results.length > 0 && b.results.length === 0) {

        return this.compare(a.results[0].score, 0, isAsc);

      } else if (a.results.length === 0 && b.results.length > 0) {
        return this.compare(0, b.results[0].score, isAsc);

      } else if (a.results.length === 0 && b.results.length === 0) {
        return this.compare(0, 0, isAsc);

      }

    });

    this.dataSource = new MatTableDataSource(this.reconciledData); // to use material filter
    this.dataSource_2 = this.reconciledData; // to update reconciledData
    this.apply_column_filter(this.filter_column);
    this.dataSource.paginator = this.paginator;
  } // end sortData

  compare(a: number | string, b: number | string, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  setAllMaxThresholdAsMatched() {
    this.reconciledData.forEach((mapping: QueryResult) => {
      if (mapping.results.length > 0 && mapping.results[0].score >= this.threshold) {
        mapping.results[0].match = true;
        // overwrite entry in automatically matched entities map
        this.automaticMatches.delete(mapping.reconciliationQuery.getQuery());
        this.automaticMatches.set(mapping.reconciliationQuery.getQuery(), mapping.results[0].id);

        // we overwrite the manual matches with the automatic match
        this.manualMatches.delete(mapping.reconciliationQuery.getQuery());
      }
    });
    this.dataSource = new MatTableDataSource(this.reconciledData); // to use material filter
    this.dataSource_2 = this.reconciledData;
    this.dataSource.paginator = this.paginator;
    this.updateThreshold();
    this.filter_column = 1;
    this.apply_column_filter(1);
  }

  removeMatched(index, match) {
    const id = match.results[0].id;
    this.manualMatches.delete(match.reconciliationQuery.query);
    this.automaticMatches.delete(match.reconciliationQuery.query);

    const isManualMatched = this.manualMatched.indexOf(id);
    if (isManualMatched !== -1) {
      this.manualMatched.splice(isManualMatched, 1);
    } else {
      this.matchedCount--;
    }
    if (this.dataSource_2[index].results[0].score >= this.threshold) {
      this.maxThresholdCount++;
    } else {
      this.skippedCount++;
    }
    this.dataSource_2[index].results[0].match = false;

  }

  addManualMatched(index, match) {
    let id = match.results[0].id;

    this.manualMatches.delete(match.reconciliationQuery.query);
    this.manualMatches.set(match.reconciliationQuery.query, id);

    this.manualMatched.push(id);
    this.dataSource_2[index].results[0].match = true;
    if (this.dataSource_2[index].results[0].score >= this.threshold) {
      this.maxThresholdCount--;
    } else {
      this.skippedCount--;
    }
  }

  /**
   * Search for property suggestions
   * @param keyword
   * @returns {Observable<any[]>}
   */
  propertyAutocomplete = (keyword: any): Observable<Object> => {
    return this.suggesterSvc.abstatAutocomplete(keyword, 'PRED');
  };

  /**
   * Custom rendering of autocomplete list
   * @param data
   * @returns {string}
   */
  autocompleteListFormatter = (data: any) => {
    return `<p class="p6 no-margin-top">${data.suggestion}</p>
                <p class="p7 no-margin-top">${data.occurrence} occurrences</p>
                <p class="p7 no-margin-top">from: ${data.dataset}</p>`;
  };

  filter(i: number) {
    this.filteredOptions = this.filterAvailable((this.reconciliationForm.get('items') as FormArray).controls[i].get('sourceColumn').value);
  }

  private filterAvailable(text: string): string[] {
    if (text !== undefined) {
      const filterValue = text.toLowerCase();
      return this.available.filter(
        option => option.toLowerCase().includes(filterValue));
    }
    return [];
  }

  removeCurrentReconciliation() {
    if (confirm("Are you sure you want to delete this reconciliation?")) {
      this.transformationObj.removeAnnotationById(this.currentAnnotation.id);
      this.transformationSvc.transformationObjSource.next(this.transformationObj);
      this.transformationSvc.previewedTransformationObjSource.next(this.transformationObj);
    }
  }
}// end export class
