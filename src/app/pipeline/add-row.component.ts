import { Component, EventEmitter, Input, Output, OnInit, DoCheck, KeyValueChangeRecord, KeyValueDiffer, KeyValueDiffers, OnChanges, SimpleChange } from '@angular/core';
import { PipelineFunction } from './pipelineFunction';
import { Pipeline, AddRowFunction } from "../transformation-data-model.service";

@Component({
  selector: 'add-row',
  templateUrl: './add-row.component.html',
  styleUrls: ['./add-row.component.css']
})
export class AddRowComponent implements OnInit, OnChanges {
  @Input() function: AddRowFunction;
  @Input() colnames: string[];
  collabels: string[] = [];
  @Output() newfunction = new EventEmitter<AddRowFunction>();
  private isNewFunction: boolean = false;
  differ: any;
  constructor(private differs: KeyValueDiffers) { }

  ngOnInit() {
    this.differ = {};
    this.differ['function'] = this.differs.find(this.function.values).create(null);
  }
  ngOnChanges() {
    if (!this.function) {
      if (!this.colnames) {
        this.function = new AddRowFunction(0, [""], null)
        this.collabels.push("Field 1");
      }
      else {
        var values: string[];
        for (let colname of this.colnames) {
          values.push("");
        }

      }
    }

  }
  colChange() {
    this.newfunction.emit(this.function);
  }
  addColumn() {
    var newLabel = "Field" + this.collabels.length;
    this.collabels.push(newLabel);
    var newColSpec = new NewColumnSpec("", "", "", "");
    this.function.columnsArray.push(newColSpec);
  }

}
