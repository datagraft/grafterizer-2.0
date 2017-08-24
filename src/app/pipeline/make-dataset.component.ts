import { Component, EventEmitter, Input, Output, OnInit, DoCheck, KeyValueChangeRecord, KeyValueDiffer, KeyValueDiffers, OnChanges, SimpleChange } from '@angular/core';
import { PipelineFunction } from './pipelineFunction';
import { Pipeline, MakeDatasetFunction } from "../transformation-data-model.service";


@Component({
  selector: 'make-dataset',
  templateUrl: './make-dataset.component.html',
  styleUrls: ['./make-dataset.component.css']
})
export class MakeDatasetComponent implements OnInit, DoCheck, OnChanges {
  @Input() function: MakeDatasetFunction;
  @Output() newfunction = new EventEmitter<MakeDatasetFunction>();
  private isNewFunction: boolean = false;

  makedatasetmode: string = "";
  differ: any;

  constructor(private differs: KeyValueDiffers) {

  }
  ngOnChanges() {
    if (!this.function) {
      this.function = new MakeDatasetFunction([], null, null, null, null);


    }
    else {

      if (this.function.moveFirstRowToHeader) {
        this.makedatasetmode = 'firstrow';
      } else if (this.function.useLazy) {
        this.makedatasetmode = 'ncolumns';
      } else {
        this.makedatasetmode = 'colnames';
      }
    }
  }
  ngOnInit() {


    this.isNewFunction = true;
    this.differ = {};
    this.differ['function'] = this.differs.find(this.function).create(null);
  };

  ngDoCheck() {
    if (this.function) {
      var changesFunction = this.differ['function'].diff(this.function);

      if (changesFunction) {
        changesFunction.forEachChangedItem((elt) => {
          if (elt.key === 'columnsArray' && this.isNewFunction) {
            this.newfunction.emit(this.function)
          }
        });
      }
    }
  };
  modeChange() {
    switch (this.makedatasetmode) {
      case 'colnames': {

        this.function.useLazy = false;
        this.function.moveFirstRowToHeader = false;
        if (this.isNewFunction) { this.newfunction.emit(this.function) };
        break;
      }
      case 'ncolumns': {
        this.function.moveFirstRowToHeader = false;
        this.function.useLazy = true;
        if (this.isNewFunction) { this.newfunction.emit(this.function) };
        break;
      }
      case 'firstrow': {
        this.function.moveFirstRowToHeader = true;
        this.function.useLazy = false;
        if (this.isNewFunction) { this.newfunction.emit(this.function) };
        break;


      }

    }
  };



}

