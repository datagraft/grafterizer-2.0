import { Component, OnInit, Input, Output, OnChanges, SimpleChanges, EventEmitter } from '@angular/core';
import { CompleterService, CompleterData } from 'ng2-completer';
import * as transformationDataModel from '../../../../../assets/transformationdatamodel.js';

@Component({
  selector: 'rename-columns',
  templateUrl: './rename-columns.component.html',
  styleUrls: ['./rename-columns.component.css']
})

export class RenameColumnsComponent implements OnInit, OnChanges {

  @Input() function: any;
  @Input() modalEnabled;
  @Input() defaultParams;
  @Output() emitter = new EventEmitter();
  @Input() transformation: any; // Transformation is needed to search for prefixers/functions
  @Input() columns: String[];
  private mappings: any;
  private functionsToRenameWith: String[];
  private docstring: String;
  private renamecolumnsmode: String;
  private test: String[] = ["keyword"];

  constructor(private completerService: CompleterService) { }

  ngOnInit() {
    this.modalEnabled = false;
    this.initFunction();
  }

  initFunction() {
    this.docstring = null;
    this.mappings = [null, null];
    this.functionsToRenameWith = [];
    this.function = new transformationDataModel.RenameColumnsFunction(this.functionsToRenameWith, this.mappings, this.docstring);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.function) {
      if (!this.function) {
        console.log('New function');
      }
      else {
        console.log('Edit function');
        if (this.function.__type == 'RenameColumnsFunction') {
          this.mappings = this.function.mappings;
          this.docstring = this.function.docstring;
          for (let functionToRenameWith of this.function.functionsToRenameWith) {
            this.functionsToRenameWith.push(functionToRenameWith);
          }
        }
      }
    }
    if (changes.defaultParams && this.defaultParams) {
      if (this.defaultParams.colsToRename) {
        this.renamecolumnsmode = "map";
        this.mappings = [];
        for (let colname of this.defaultParams.colsToRename) {
          this.mappings.push(colname, "");
        }
      }
    }
  }

  addRenameFunction() {
    this.functionsToRenameWith.push(undefined);
    this.test.push(undefined);
  }

  removeFunction(idx) {
    this.functionsToRenameWith.splice(idx, 1);
    this.test.splice(idx, 1);
  }

  addMapping() {
    this.mappings.push(null, null);
  }

  removeMapping(idx) {
    this.mappings.splice(idx, 2);
  }

  getmaplength() {
    var b = [];
    for (var i = 0; i < this.mappings.length; i += 2) b.push(i);
    return b;
  }

  accept() {
    let map = [];
    if (this.mappings[0] && !this.mappings[0].hasOwnProperty('id')) {
      for (var i = 0; i < this.mappings.length; ++i) {
        map.push((i % 2) ? this.mappings[i] : {
          id: i / 2,
          value: this.mappings[i]
        });
      }
      this.function.mappings = map;
    }
    console.log(map)
    console.log(this.mappings)
    this.function.functionsToRenameWith = [];
    for (let functionToRenameWith of this.test) {
      this.function.functionsToRenameWith.push(this.functionsToRenameWith);
    }
    this.function.docstring = this.docstring;
    this.emitter.emit(this.function);
    this.initFunction();
    this.modalEnabled = false;
  }

  cancel() { this.modalEnabled = false; }

}
