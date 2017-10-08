import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

import { RemoveDuplicatesFunction } from '../../../../../assets/transformationdatamodel.js';

@Component({
  selector: 'deduplicate',
  templateUrl: './deduplicate.component.html',
  styleUrls: ['./deduplicate.component.css']
})
export class DeduplicateComponent implements OnInit {

  @Input() modalEnabled;
  @Input() colnames: string[];
  @Output() emitter = new EventEmitter();
  private function: any;
  private showMessage: boolean;
  private mode;
  private columns;
  private docstring: String;

  constructor() { }

  ngOnInit() {
    //should be removed when column names are provided from the outside
    this.colnames = ["Weather", "Temperature", "Rain"];
    if (!this.function) {
      this.mode = "full";
      this.columns = [];
      this.docstring = "";
    } else {
      this.mode = this.function.mode;
      this.columns = this.function.colNames;
      this.docstring = this.function.docstring;
    }
  }


  accept() {
    if (this.mode == "colnames" && this.columns.length < 1) {
      this.showMessage = true;
    }
    else {
      this.showMessage = false;
      if (!this.function) {
        this.function = new RemoveDuplicatesFunction(this.mode, this.columns, this.docstring);
      } else {
        this.function.mode = this.mode;
        this.function.columns = this.columns;
        this.function.docstring = this.docstring;
      }
      this.emitter.emit(this.function);
      this.modalEnabled = false;
    }

  }

  cancel() {
    this.modalEnabled = false;
  }

}
