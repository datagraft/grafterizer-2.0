import { Component, OnInit, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { AddRowFunction } from '../../../../../assets/transformationdatamodel.js';

@Component({
  selector: 'add-row',
  templateUrl: './add-row.component.html',
  styleUrls: ['./add-row.component.css']
})
export class AddRowComponent implements OnInit, OnChanges {

  @Input() modalEnabled;
  @Input() private function: any;
  @Input() colnames: string[];
  @Output() emitter = new EventEmitter();
  private position: number = 0;
  private values: any = [];
  private docstring: String;

  constructor() { }

  ngOnInit() {
    //should be removed when column names are provided from the outside
    this.function = new AddRowFunction(this.position, this.values, this.docstring);
    this.colnames = ["Weather", "Rain", "Temperature"];
  }
  ngOnChanges() {
    if (!this.function) {
      this.values = [];
      this.docstring = "";
      this.position = 0;

    } else {
      this.values = this.function.values;
      this.position = this.function.position;
      this.docstring = this.function.docstring;
    }
    // this.values = [2, 3, "Value"];
    // this.position = this.function.position ;
    // this.docstring = this.function.docstring;
  }

  accept() {
    if (!this.function) {
      this.function = new AddRowFunction(this.position, this.values, this.docstring);
    } else {
      this.function.position = this.position;
      this.function.values = this.values;
      this.function.docstring = this.docstring;
    }
    this.emitter.emit(this.function);
    this.modalEnabled = false;
  }

  cancel() {
    this.modalEnabled = false;
  }

}