import {Component, Inject, OnInit, ViewChild} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef, MatPaginator, MatTableDataSource, Sort} from '@angular/material';
import {EnrichmentService} from '../enrichment.service';
import {ConciliatorService, QueryResult, ReconciliationDeriveMap, Result, Type} from '../enrichment.model';
import {AddEntityDialogComponent} from './addEntityDialog.component';
import {FormArray, FormBuilder, FormControl, FormGroup} from '@angular/forms';
import {AnnotationService} from '../../annotation.service';
import {Annotation} from '../../annotation.model';
import {Observable} from 'rxjs';
import {AsiaMasService} from '../../asia-mas/asia-mas.service';
import {CustomValidators} from '../../shared/custom-validators';

@Component({
  selector: 'app-reconciliation',
  templateUrl: './reconciliation.component.html',
  styleUrls: ['./reconciliation.component.css']
})
export class ReconciliationComponent implements OnInit {


  constructor(private fb: FormBuilder, public dialogRef: MatDialogRef<ReconciliationComponent>,
              @Inject(MAT_DIALOG_DATA) public dialogInputData: any, public dialog: MatDialog, public annotationService: AnnotationService,
              private enrichmentService: EnrichmentService,
              private suggesterSvc: AsiaMasService) {
  }

  public annotation: Annotation;
  public close = false;
  public colIndex: any;
  public filter_column = 0;
  public change_selecet = false;
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
  public selectedService: string;
  public services: Map<string, ConciliatorService>;
  public newColumnName: string;
  public guessedType: Type;
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
  public propertyArray: string[];
  public sourceArray: string[];
  public reconcileWithProperties = false;


  @ViewChild(MatPaginator) paginator: MatPaginator;
  public available: string[];
  public index: number;
  public openedSource: string;
  filteredOptions: string[];


  ngOnInit() {
    this.header = this.dialogInputData.header;
    this.annotation = this.dialogInputData.annotation;
    this.colIndex = this.dialogInputData.indexCol;
    this.services = new Map();
    this.servicesGroups = [];
    this.openedSource = '';
    this.enrichmentService.listServices().subscribe((data) => {
      Object.keys(data).forEach((serviceCategory) => {
        data[serviceCategory].forEach((service) => {
          this.services.set(service['id'], new ConciliatorService({...service, ...{'group': serviceCategory}}));
        });
        this.servicesGroups.push(serviceCategory);
      });
    });
    this.fillAllowedSourcesArray();
    this.index = 0;
    this.showPreview = false;
    this.dataLoading = false;
    this.reconciledData = [];
    this.threshold = 0.8;
    this.skippedCount = 0;
    this.matchedCount = 0;
    this.maxThresholdCount = 0;
    this.notReconciledCount = 0;
    this.reconciliationForm = this.fb.group({
      selectedGroup: new FormControl(''),
      selectedService: new FormControl(''),
      items: this.fb.array([this.createNewItem()]),
      newColumnName: new FormControl(''),
      shiftColumn: new FormControl('')
    });
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
    if ((this.reconciliationForm.get('items') as FormArray).controls.length > 0 && this.reconcileWithProperties) {
      this.filterEmptySelect();
    }
    this.skippedCount = 0;
    this.matchedCount = 0;
    this.maxThresholdCount = 0;
    this.notReconciledCount = 0;
    this.dataLoading = true;
    this.showPreview = true;
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

  public submit() {

    const deriveMaps = [];

    if (!this.reconciliationForm.get('newColumnName').value || this.reconciliationForm.get('newColumnName').value.trim().length === 0) {
      this.reconciliationForm.get('newColumnName').setValue(this.header + '_' + this.reconciliationForm.get('selectedService').value);
    }

    this.reconciliationForm.get('newColumnName').setValue(this.reconciliationForm.get('newColumnName').value.replace(/\s/g, '_'));
    deriveMaps.push(
      new ReconciliationDeriveMap(this.reconciliationForm.get('newColumnName').value, this.sourceArray)
        .buildFromMapping(this.reconciledData, this.threshold, [this.guessedType].filter(p => p != null)));
    this.dialogRef.close({
      'deriveMaps': deriveMaps,
      'conciliator': this.services.get(this.reconciliationForm.get('selectedService').value),
      'shift': this.reconciliationForm.get('shiftColumn').value,
      'header': this.header,
      'indexCol': this.colIndex
    });

  }

  updateServicesForSelectedGroup(): void {
    this.servicesForSelectedGroup = Array.from(this.services.values()).filter(
      s => s.getGroup() === this.reconciliationForm.get('selectedGroup').value);
    this.reconciliationForm.get('selectedGroup').setValue(this.servicesForSelectedGroup[0].getGroup());
    this.showPreview = false;
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

  set_reconciled(index, select) {

    if (select !== 0) {
      this.manualMatched.push(this.dataSource_2[index].results[select].id);
      this.temp_option = this.dataSource_2[index].results[0].name;
      this.temp_score = this.dataSource_2[index].results[0].score;
      this.temp_link = this.dataSource_2[index].results[0].id;
      this.temp_match = this.dataSource_2[index].results[0].match;

      this.dataSource_2[index].results[0].name = this.dataSource_2[index].results[select].name;
      this.dataSource_2[index].results[0].score = this.dataSource_2[index].results[select].score;
      this.dataSource_2[index].results[0].id = this.dataSource_2[index].results[select].id;
      this.dataSource_2[index].results[0].match = true;

      this.dataSource_2[index].results[select].name = this.temp_option;
      this.dataSource_2[index].results[select].score = this.temp_score;
      this.dataSource_2[index].results[select].id = this.temp_link;
      this.dataSource_2[index].results[select].match = this.temp_match;
      if (this.change_selecet) {
        this.selected = -4;
        this.change_selecet = false;
      } else {
        this.selected = -3;
        this.change_selecet = true;
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
      data: {'identifierSpace': this.services.get(this.reconciliationForm.get('selectedService').value).getIdentifierSpace()}
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result && result['id'] && result['name']) {
        while (this.dataSource_2[row_index].results.length >= 5) {
          this.dataSource_2[row_index].results.splice(4, 1);
        }
        this.dataSource_2[row_index].results.push({
          id: result.id, name: result.name, types: null, score: 1, match: true
        });

        this.index_added = this.dataSource_2[row_index].results.length - 1;
        this.set_reconciled(row_index, this.index_added);
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

  setAllMaxThresholdAsMAtched() {
    this.reconciledData.forEach((mapping: QueryResult) => {
      if (mapping.results.length > 0 && mapping.results[0].score >= this.threshold) {
        mapping.results[0].match = true;
      }
    });
    this.dataSource = new MatTableDataSource(this.reconciledData); // to use material filter
    this.dataSource_2 = this.reconciledData;
    this.dataSource.paginator = this.paginator;
    this.updateThreshold();
    this.filter_column = 1;
    this.apply_column_filter(1);
  }

  removeManualMatched(index, id) {
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

  addManualMatched(index, id) {
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
}// end export class
