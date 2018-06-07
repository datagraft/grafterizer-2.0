import { Component, OnInit, Output, EventEmitter, Input, OnChanges, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Observable } from 'rxjs/Rx';
import { Subscription } from 'rxjs/Subscription';
import {
  AddRowFunction, DropRowsFunction, ColumnsFunction, MakeDatasetFunction,
  MapcFunction, KeyFunctionPair, CustomFunctionDeclaration
} from '../../../assets/transformationdatamodel.js';
import { timeout } from 'q';
import { TransformationService } from 'app/transformation.service';

declare var Handsontable: any;

@Component({
  selector: 'app-handsontable',
  templateUrl: './handsontable.component.html',
  styleUrls: ['./handsontable.component.css']
})

export class HandsontableComponent implements OnInit, OnChanges, OnDestroy {

  @Output() selectionChanged: EventEmitter<any> = new EventEmitter<any>();

  // handsontable instance
  public hot: any;

  private data: any;
  private container: any;
  private settings: any;
  private showLoading: boolean;

  public selectedFunction: any;
  public selectedDefaultParams: any;

  private dataSubscription: Subscription;
  private previewedTransformationSubscription: Subscription;

  @Input() suggestions;
  @Output() emitter = new EventEmitter();

  constructor(private transformationSvc: TransformationService, private cd: ChangeDetectorRef) {
    this.data = [];
  }

  ngOnInit() {
    this.container = document.getElementById('handsontable');
    this.settings = {
      data: [],
      rowHeaders: true,
      autoColumnSize: { useHeaders: true },
      manualColumnResize: true,
      height: 645,
      columnSorting: false,
      viewportColumnRenderingOffset: 30,
      viewportRowRenderingOffset: 'auto',
      wordWrap: true,
      stretchH: 'all',
      className: 'htCenter htMiddle',
      observeDOMVisibility: true,
      observeChanges: true,
      preventOverflow: false,
      afterChange: () => {
        setTimeout(() => {
          this.hot.render();
        }, 10);
      },
      afterSelection: (r, c, r2, c2) => {
        // console.log(r, c, r2, c2);
        const src = this.hot.getSourceData(r, c, r2, c2);
        this.selectionChanged.emit({
          row: r,
          col: c,
          row2: r2,
          col2: c2,
          totalRows: this.hot.countRows(),
          totalCols: this.hot.countCols()
        });
        this.hot.render();
      },
    };

    this.hot = new Handsontable(this.container, this.settings);
    this.previewedTransformationSubscription = this.transformationSvc.currentPreviewedTransformationObj
      .subscribe((previewedTransformation) => {
        this.showLoading = true;
      });

    this.dataSubscription = this.transformationSvc.currentGraftwerkData.subscribe(message => {
      if (typeof message[":column-names"] !== 'undefined' && message[":column-names"].length > 0) {
        console.log('Data Changed');
        this.displayJsEdnData(message);
      }
    });
  }

  ngOnDestroy() {
    this.dataSubscription.unsubscribe();
  }

  emitFunction(value: any) {
    this.emitter.emit(value);
  }

  ngOnChanges() {
    if (this.hot) {
      const enabledMenuItems = [];
      // for HoT submenus keys
      const keySuggestionMap = {
        'newcol:1': 'AddColumnsFunction',
        'newcol:2': 'DeriveColumnFunction',
        'newrow:1': 'add-row-below',
        'newrow:2': 'add-row-above',
        'newrow:3': 'AddRowFunction',
        'deduplicate': 'RemoveDuplicatesFunction',
        'filter-rows': 'GrepFunction',
        'group-dataset': 'GroupRowsFunction',
        'make-dataset-header': 'make-dataset-header',
        'mapc': 'MapcFunction',
        'mapc:1': 'map-columns-uc',
        'mapc:2': 'MapcFunction',
        'merge-columns': 'MergeColumnsFunction',
        'rename-columns': 'RenameColumnsFunction',
        'reshape': 'MeltFunction',
        'sort': 'SortDatasetFunction',
        'split-columns': 'SplitFunction',
        'take-rows-delete': 'take-rows-delete',
        'take-columns-delete': 'take-columns-delete'

      };
      for (const suggestion of this.suggestions) {
        enabledMenuItems.push(suggestion.label);
      }
    }
  }

  private selectionChangeHandler(row: number, column: number, row2: number, col2: number) {
    this.selectionChanged.emit({
      row: row,
      col: column,
      row2: row2,
      col2: col2,
      totalRows: this.hot.countRows(),
      totalCols: this.hot.countCols()
    });
  }

  public displayJsEdnData(data: JSON) {
    if (data[':column-names'] && data[':rows']) {
      const columnNames = data[':column-names'];
      const rowData = data[':rows'];
      const columnMappings = [];
      // Remove leading ':' from the EDN response
      const colNamesClean = [];
      columnNames.forEach((colname, index) => {
        const colNameClean = colname.substring(1);
        colNamesClean.push(colNameClean);
        columnMappings.push({
          data: colname
        });
      });

      if (colNamesClean && columnMappings) {
        this.hot.updateSettings({
          colHeaders: colNamesClean,
          columns: columnMappings,
          data: data[':rows']
        });
      }
      console.log('removing loading bar..');
      this.showLoading = false;
    } else {
      // TODO error handling one day!!
      throw new Error('Invalid format of data!');
    }
  }
}