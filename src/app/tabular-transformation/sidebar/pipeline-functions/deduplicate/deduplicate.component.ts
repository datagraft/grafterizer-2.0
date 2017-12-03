import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';

import { RemoveDuplicatesFunction } from '../../../../../assets/transformationdatamodel.js';

@Component({
  selector: 'deduplicate',
  templateUrl: './deduplicate.component.html',
  styleUrls: ['./deduplicate.component.css']
})
export class DeduplicateComponent implements OnInit, OnChanges {

  @Input() modalEnabled;
  @Input() function: any;
  @Input() columns: any[] = [];
  //private columns = ["col1", "col2"]
  @Output() emitter = new EventEmitter();
  private showMessage: boolean = false;
  private mode;
  private colnames;
  private docstring: String;

  constructor() { }

  ngOnInit() {
    //should be removed when column names are provided from the outside
    //this.columns = ["Weather", "Temperature", "Rain"];

  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.columns) {
      // Before dataset is loaded and headers are known
      if (!this.columns) this.columns = [];
    }
    if (changes.function) {
      if (!this.function) {
        this.mode = "full";
        this.colnames = [];
        this.docstring = "";
        this.function = new RemoveDuplicatesFunction(null, [], null, null);
      } else {
        this.mode = this.function.mode;
        this.colnames = this.function.columns.map(o => o.value);
        this.docstring = this.function.docstring;
      }

    }

  }

  accept() {
    console.log(this.mode, this.colnames);
    if (this.mode == "columns" && this.colnames.length < 1) {
      this.showMessage = true;
    }
    else {
      this.showMessage = false;

      this.function.mode = this.mode;
      this.function.columns = [];
      for (let c of this.colnames) {
        this.function.columns.push({ id: 0, value: c });
      }

      this.function.docstring = this.docstring;

      console.log(this.function);
      this.emitter.emit(this.function);
      this.modalEnabled = false;
    }

  }

  cancel() {
    this.modalEnabled = false;
  }

}
