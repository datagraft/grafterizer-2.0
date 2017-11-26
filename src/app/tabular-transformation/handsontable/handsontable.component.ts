import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs/Rx';
import { Subscription } from 'rxjs/Subscription';

declare var Handsontable: any;

@Component({
  selector: 'app-handsontable',
  templateUrl: './handsontable.component.html',
  styleUrls: ['./handsontable.component.css']
})

export class HandsontableComponent implements OnInit {

  @Output() selectionChanged: EventEmitter<any> = new EventEmitter<any>();

  // handsontable instance
  private hot: any;
  private data: any;
  private container: any;
  private settings: any;
  public selction: any;
  public showLoading: boolean;

  constructor() {
    this.showLoading = true;
    this.data = [];
    for (let i = 0; i <= 12; i++) {
      this.data.push(['-', '-', '-', '-', '-']);
    }
  }

  ngOnInit() {
    this.container = document.getElementById('handsontable');
    this.settings = {
      data: this.data,
      rowHeaders: true,
      colHeaders: [],
      columnSorting: false,
      contextMenu: {
        callback: (key, options) => {
          if (key === 'row_above' || 'row_below' || 'remove_col'
            || 'remove_row' || 'col_left' || 'col_right' || 'undo' || 'redo' || 'zero') {
            console.log(key);

          };
          if (key === 'zero') {
            console.log(key);
          };
        },
        items: {
          row_above: {},
          row_below: {},
          remove_col: {},
          remove_row: {},
          col_left: {},
          col_right: {},
          zero: { name: 'Set empty cells to median' },
          undo: {},
          redo: {}
        },
      },
      stretchH: 'all',
      afterSelection: this.selectionChangeHandler.bind(this) /*(r, c, r2, c2) => {
        console.log(r,c,r2,c2);
        const src = this.hot.getSourceData(r,c,r2,c2);
        console.log(src);
        if(r === r2){
          // selected row
        } else {
          if (c === c2) {
            // selected column
          }
        }
        console.log('OK');
      }*/,
      manualColumnResize: true,
      manualRowResize: true
    }
    this.hot = new Handsontable(this.container, this.settings);
    this.hot.render();
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
    console.log(data[':rows']);
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
      this.hot.updateSettings({
        colHeaders: colNamesClean,
        columns: columnMappings,
        data: data[':rows']
      });
      this.showLoading = false;
      //this.hot.render();
    } else {
      // TODO error handling one day!!
      throw new Error('Invalid format of data!');
    }

  }
}
