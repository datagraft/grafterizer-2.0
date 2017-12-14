
import { Component, OnInit, Output, EventEmitter, Input, OnChanges } from '@angular/core';
import { Observable } from 'rxjs/Rx';
import { Subscription } from 'rxjs/Subscription';
import { AddRowFunction, DropRowsFunction, ColumnsFunction, MakeDatasetFunction, MapcFunction, KeyFunctionPair, CustomFunctionDeclaration } from '../../../assets/transformationdatamodel.js';
import { timeout } from 'q';

declare var Handsontable: any;

@Component({
  selector: 'app-handsontable',
  templateUrl: './handsontable.component.html',
  styleUrls: ['./handsontable.component.css']
})

export class HandsontableComponent implements OnInit, OnChanges {

  @Output() selectionChanged: EventEmitter<any> = new EventEmitter<any>();

  // handsontable instance
  public hot: any;

  private data: any;
  private container: any;
  private settings: any;
  public selction: any;
  public showLoading: boolean;
  private colNamesClean: any;

  public selectedFunction: any;
  public selectedDefaultParams: any;
  @Input() suggestions;
  @Output() emitter = new EventEmitter();

  constructor() {
    this.showLoading = true;
    this.data = [];
    // for (let i = 0; i <= 12; i++) {
    //  this.data.push(['-', '-', '-', '-', '-']);
    //}
  }

  ngOnInit() {
    this.container = document.getElementById('handsontable');
    this.settings = {
      data: this.data,
      rowHeaders: true,
      autoColumnSize: false,
      manualColumnResize: true,
      columnSorting: false,
      viewportColumnRenderingOffset: 40,
      height: 600,
      width: 1610,
      wordWrap: true,
      stretchH: 'all',
      className: 'htCenter htMiddle',
      observeDOMVisibility: true,
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
    }
    this.hot = new Handsontable(this.container, this.settings);
  }

  emitFunction(value: any) {
    this.emitter.emit(value);
  }

  ngOnChanges() {
    if (this.hot) {
      var enabledMenuItems = [];
      //for HoT submenus keys 
      var keySuggestionMap = {
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
      for (let suggestion of this.suggestions) {
        enabledMenuItems.push(suggestion.label);
      }

      // this.hot.updateSettings({
      //   contextMenu: {
      //     callback: (key, options) => {
      //       this.selectedFunction = key;
      //       for (let i in keySuggestionMap) {
      //         if (i == key) {
      //           var selectedSuggestion = this.suggestions.find(o => o.value.id === keySuggestionMap[i]);
      //           this.selectedDefaultParams = selectedSuggestion.value.defaultParams;
      //         }
      //       };
      //       console.log(key, this.selectedDefaultParams)
      //       switch (key) {
      //         case 'newrow:1':
      //         case 'newrow:2':
      //           this.emitFunction(new AddRowFunction(this.selectedDefaultParams.position, this.selectedDefaultParams.values, ""));
      //           break;
      //         case 'make-dataset-header':
      //           this.emitFunction(new MakeDatasetFunction(
      //             [], null, undefined, this.selectedDefaultParams.moveFirstRowToHeader, null));
      //           break;
      //         case 'mapc:1':
      //           console.log("Map cols UC");
      //           this.emitFunction(new MapcFunction(
      //             this.selectedDefaultParams.keyFunctionPairs, null));
      //           break;
      //         case 'take-rows-delete':
      //           this.emitFunction(new DropRowsFunction(
      //             this.selectedDefaultParams.indexFrom, this.selectedDefaultParams.indexTo, this.selectedDefaultParams.take, null));
      //           break;
      //         case 'take-columns-delete':
      //           this.emitFunction(new ColumnsFunction(
      //             [this.selectedDefaultParams.colToDelete], null, null, false, null));
      //           break;
      //         default:
      //           break;
      //       }
      //     },
      //     items: {
      //       "newcol": {
      //         key: "newcol",
      //         name: "New column",
      //         "submenu": {
      //           "items": [{
      //             key: "newcol:1",
      //             "name": "Add column",
      //           }, {
      //             key: "newcol:2",
      //             "name": "Derive column",
      //           }]
      //         }
      //       },
      //       "newrow": {
      //         key: "newrow",
      //         name: "New row",
      //         "submenu": {
      //           "items": [{
      //             key: "newrow:1",
      //             "name": "Insert row below",
      //             disabled: function () {
      //               return !enabledMenuItems.includes("Insert row below");
      //             }
      //           }, {
      //             key: "newrow:2",
      //             "name": "Insert row above",
      //             disabled: function () {
      //               return !enabledMenuItems.includes("Insert row above");
      //             }
      //           }, {
      //             key: "newrow:3",
      //             "name": "Insert row (custom position)"
      //           }]
      //         }
      //       },
      //       deduplicate: {
      //         name: 'Deduplicate',
      //         key: 'deduplicate',
      //         disabled: function () {
      //           return !enabledMenuItems.includes("Deduplicate");
      //         }
      //       },
      //       filter: {
      //         name: 'Filter rows',
      //         key: 'filter-rows',
      //         disabled: function () {
      //           return !enabledMenuItems.includes("Filter rows");
      //         }
      //       },
      //       group: {
      //         name: 'Group and aggregate',
      //         key: 'group-dataset',
      //         disabled: function () {
      //           return !enabledMenuItems.includes("Group and aggregate");
      //         }
      //       },
      //       header: {
      //         name: 'Set first row as a header',
      //         key: 'make-dataset-header',
      //         disabled: function () {
      //           return !enabledMenuItems.includes("Set first row as a header");
      //         }
      //       },
      //       "mapc": {
      //         key: "mapc",
      //         name: "Map columns",
      //         disabled: function () {
      //           return !enabledMenuItems.includes("Map columns");
      //         },
      //         "submenu": {
      //           "items": [{
      //             key: "mapc:2",
      //             "name": "Set empty cells to median",
      //             disabled: function () {
      //               return true;
      //             }
      //           },
      //           {
      //             key: "mapc:1",
      //             "name": "Convert to uppercase",
      //             disabled: function () {
      //               return !enabledMenuItems.includes("Convert to uppercase");
      //             }
      //           }
      //           // Second-level submenu bug https://github.com/handsontable/handsontable/issues/3533 
      //           /*{ 
      //             key: "submenu:3", 
      //             "name": "Convert case to", 
      //             disabled: function () { 
      //               return !enabledMenuItems.includes("Convert to uppercase"); 
      //             }, 

      //             'submenu': { 
      //               key: "submenu:submenu:1", 
      //               name: 'submenu:submenu:1', 
      //               'items': [{ 
      //                 key: "submenu:1", 
      //                 "name": "UPPERCASE", 
      //                 disabled: function () { 
      //                   return !enabledMenuItems.includes("Convert to uppercase"); 
      //                 }, 
      //                 callback: (key, options) => { 
      //                   console.log(key); 

      //                 }, 
      //               }, { 
      //                 key: "submenu:2", 
      //                 "name": "lowercase", 
      //                 disabled: function () { 
      //                   return true; 
      //                 } 
      //               }, { 
      //                 key: "submenu:3", 
      //                 "name": "Proper Case", 
      //                 disabled: function () { 
      //                   return true; 
      //                 } 
      //               }, 
      //               { 
      //                 key: "submenu:3", 
      //                 "name": "Sentence case", 
      //                 disabled: function () { 
      //                   return true; 
      //                 } 
      //               }] 
      //             } 
      //           }*/]
      //         }
      //       },
      //       merge_columns: {
      //         name: 'Merge columns',
      //         key: 'merge-columns',
      //         disabled: function () {
      //           return !enabledMenuItems.includes("Merge columns");
      //         }
      //       },
      //       rename_columns: {
      //         name: 'Rename columns',
      //         key: 'rename-columns',
      //         disabled: function () {
      //           return !enabledMenuItems.includes("Rename columns");
      //         }
      //       },
      //       "reshape": {
      //         key: "reshape",
      //         name: "Reshape dataset",
      //         disabled: function () {
      //           return !enabledMenuItems.includes("Reshape dataset");
      //         }/*, 
      //         "submenu": { 
      //           "items": [{ 
      //             key: "reshape:1", 
      //             "name": "Melt" 
      //           }, { 
      //             key: "reshape:2", 
      //             "name": "Cast" 
      //           }] 
      //         }*/
      //       },
      //       "sort": {
      //         key: "sort",
      //         name: "Sort dataset",
      //         disabled: function () {
      //           return !enabledMenuItems.includes("Sort dataset");
      //         },
      //         /* "submenu": { 
      //            "items": [{ 
      //              key: "sort:1", 
      //              "name": "Alphabetically" 
      //            }, { 
      //              key: "sort:2", 
      //              "name": "Numerically" 
      //            }, { 
      //              key: "sort:3", 
      //              "name": "By length" 
      //            }, { 
      //              key: "sort:4", 
      //              "name": "By date" 
      //            }] 
      //          }*/
      //       },
      //       split_col: {
      //         name: 'Split columns',
      //         key: "split-columns",
      //         disabled: function () {
      //           return !enabledMenuItems.includes("Split columns");
      //         }
      //       },
      //       remove_col: {
      //         name: 'Delete column',
      //         key: "take-columns-delete",
      //         disabled: function () {
      //           return !enabledMenuItems.includes("Delete column");
      //         }
      //       },
      //       remove_row: {
      //         name: 'Delete row',
      //         key: "take-columns-delete",
      //         disabled: function () {
      //           return !enabledMenuItems.includes("Delete row");
      //         }
      //       },
      //       undo: {},
      //       redo: {}
      //     },
      //   }
      // })
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
    this.showLoading = true;
    // console.log(data[':rows']);
    if (data[':column-names'] && data[':rows']) {
      const columnNames = data[':column-names'];
      const rowData = data[':rows'];
      const columnMappings = [];
      // Remove leading ':' from the EDN response
      this.colNamesClean = [];
      columnNames.forEach((colname, index) => {
        const colNameClean = colname.substring(1);
        this.colNamesClean.push(colNameClean);
        columnMappings.push({
          data: colname
        });
      });
      this.hot.updateSettings({
        colHeaders: this.colNamesClean,
        columns: columnMappings,
        data: data[':rows']
      });
      this.showLoading = false;
    } else {
      // TODO error handling one day!!
      throw new Error('Invalid format of data!');
    }
  }
}
