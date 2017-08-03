import { Component, OnInit } from '@angular/core';

declare var Handsontable: any;

@Component({
  selector: 'handsontable',
  templateUrl: './handsontable.component.html',
  styleUrls: ['./handsontable.component.css']
})
export class HandsontableComponent implements OnInit {

  // handsontable instance
  private hot: any;
  private data: Array<any>;
  private container: any;
  private settings: Object;

  constructor() {
    // init table
    this.data = [];
    for (let i = 0; i <= 10; i++) {
      this.data.push(["-", "-", "-", "-", "-"]);
    }
   }

  ngOnInit() {
    this.container = document.getElementById('handsontable');
    this.settings = {
      data: this.data,
      rowHeaders: true,
      colHeaders: true,
      columnSorting: false,
      viewportColumnRenderingOffset: 40,
      contextMenu: {
        callback: (key, options) => {
          if (key === 'row_above' || 'row_below' || 'remove_col' || 'remove_row' || 'col_left' || 'col_right' || 'undo' || 'redo' || 'zero') {
            console.log(key);

          };
          if (key === "zero") {
            console.log(key);
          };
        },
        items: {
          "row_above": {},
          "row_below": {},
          "remove_col": {},
          "remove_row": {},
          "col_left": {},
          "col_right": {},
          "zero": { name: 'Set empty cells to median' },
          "undo": {},
          "redo": {}
        },
      },
      height: 282,
      stretchH: 'all',
      className: 'htCenter htMiddle',
      afterSelection: (r, c, r2, c2) => {
            console.log('OK');        
      }
    }
    this.hot = new Handsontable(this.container, this.settings);
    }
}
