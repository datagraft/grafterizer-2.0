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
  private position: number;
  private values: any;
  private docstring: String;

  constructor() { }

  ngOnInit() {
    this.modalEnabled = false;
    this.initFunction();
  }

  initFunction() {
    this.values = [];
    this.docstring = null;
    this.position = 0;
    this.function = new AddRowFunction(this.position, this.values, this.docstring);

  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.function) {
      if (!this.function) {
        // console.log('New function');
        this.position = 0;
      } else {
        console.log('Edit function');
        if (this.function.__type == 'AddRowFunction') {
          this.values = this.function.values.map(o => o.value);
          this.position = this.function.position;
          this.docstring = this.function.docstring;
        }
      }
    }
  }

  accept() {
    console.log(this.function);
    this.function.position = this.position;
    this.function.values = [];
    for (let v of this.values) { this.function.values.push(v); }
    this.function.docstring = this.docstring;
    this.emitter.emit(this.function);
    this.initFunction();
    this.modalEnabled = false;
  }

  cancel() { this.modalEnabled = false; }

}