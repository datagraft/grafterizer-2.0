import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { AddRowFunction } from '../../../../../assets/transformationdatamodel.js';

@Component({
  selector: 'add-row',
  templateUrl: './add-row.component.html',
  styleUrls: ['./add-row.component.css']
})
export class AddRowComponent implements OnInit, OnChanges {

  @Input() modalEnabled;
  @Input() function: any;
  @Input() columns: string[];
  @Output() emitter = new EventEmitter();
  private position: number = 0;
  private values: any = [];
  private docstring: String;

  constructor() { }

  ngOnInit() {
    //should be removed when column names are provided from the outside
    this.function = new AddRowFunction(this.position, this.values, this.docstring);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.function) {
      if (!this.function) {
        this.values = [];
        this.docstring = "";
        this.position = 0;
      } else {
        if (this.function.__type == 'AddRowFunction') {
          this.values = this.function.values.map(o => o.value);
          this.position = this.function.position;
          this.docstring = this.function.docstring;
        }
      }
    }
  }

  accept() {
    if (!this.function) {
      this.function = new AddRowFunction(this.position, this.values, this.docstring);
    } else {
      this.function.position = this.position;
      this.function.values = [];
      for (let v of this.values) { this.function.values.push({ id: 0, value: v }); }
      this.function.docstring = this.docstring;
    }
    console.log(this.function);
    this.emitter.emit(this.function);
    this.modalEnabled = false;
  }

  cancel() {
    this.modalEnabled = false;
  }

}