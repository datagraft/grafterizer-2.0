import { Component, EventEmitter, Input, Output, OnInit, DoCheck, KeyValueChangeRecord, KeyValueDiffer, KeyValueDiffers, OnChanges, SimpleChange } from '@angular/core';
import { PipelineFunction } from './pipelineFunction';
import { Pipeline, AddColumnsFunction, NewColumnSpec } from "../transformation-data-model.service";

@Component({
  selector: 'add-columns',
  templateUrl: './add-columns.component.html',
  styleUrls: ['./add-columns.component.css']
})
export class AddColumnsComponent implements OnInit, OnChanges {
  @Input() function: AddColumnsFunction;
  @Output() newfunction = new EventEmitter<AddColumnsFunction>();
  private isNewFunction: boolean = false;
  public addcolumnsmode: string[];
  differ: any;
  constructor(private differs: KeyValueDiffers) { }

  ngOnInit() {
    this.differ = {};
    this.differ['function'] = this.differs.find(this.function.columnsArray).create(null);
  };
  ngOnChanges() {
    if (!this.function) {
      var newColSpec = new NewColumnSpec("", "", "", "");
      this.function = new AddColumnsFunction([newColSpec], null);
      this.isNewFunction = true;
      this.addcolumnsmode = ['text'];

    }
    else {
      var i = 0;
      for (let newCol of this.function.columnsArray) {
        console.log(newCol);
        if (newCol.colValue) { this.addcolumnsmode[i] = 'text' }
        else { this.addcolumnsmode[i] = 'expr' }
        ++i;
      }
    }
  };

  colChange() {
    this.newfunction.emit(this.function);
  }
  addColumn() {
    var newColSpec = new NewColumnSpec("", "", "", "");
    this.function.columnsArray.push(newColSpec);
  }
  removeColumn(idx: number) {
    this.function.columnsArray.splice(idx, 1);
    this.addcolumnsmode.splice(idx, 1);
  }
  modeChange(idx: number) {
    if (this.addcolumnsmode[idx] == "text") {
      this.function.columnsArray[idx].specValue = null;
    }
    else {
      this.function.columnsArray[idx].colValue = null;
    }

  }

}
