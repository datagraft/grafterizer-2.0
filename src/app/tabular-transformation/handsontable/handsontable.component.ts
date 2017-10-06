import { Component, OnInit } from '@angular/core';
declare var Handsontable: any;

@Component({
  selector: 'app-handsontable',
  templateUrl: './handsontable.component.html',
  styleUrls: ['./handsontable.component.css']
})
export class HandsontableComponent implements OnInit {

  // handsontable instance
  private hot: any;
  private data: any[];
  private container: any;
  private settings: any;

  constructor() {
    // init table
    this.data = [];
    for (let i = 0; i <= 12; i++) {
      this.data.push(['-', '-', '-', '-', '-']);
    }
  }

  ngOnInit() {
    this.container = document.getElementById('app-handsontable');
    this.settings = {
      data: this.data,
      rowHeaders: true,
      colHeaders: [],
      columnSorting: false,
      viewportColumnRenderingOffset: 40,
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
      height: 330,
      stretchH: 'all',
      className: 'htCenter htMiddle',
      afterSelection: (r, c, r2, c2) => {
        console.log('OK');
      }
    }
    this.hot = new Handsontable(this.container, this.settings);
  }

  public dispayJsEdnData(data: JSON) {
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
      })
      this.hot.render();
    } else {
      // TODO error handling one day!!
      throw new Error('Invalid format of data!');
    }

  }
}
