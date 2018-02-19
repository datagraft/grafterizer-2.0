import { Component, OnInit } from '@angular/core';

import * as transformationDataModel from '../../../../../assets/transformationdatamodel.js';
import { Subscription } from 'rxjs/Subscription';
import { PipelineEventsService } from 'app/tabular-transformation/pipeline-events.service';
import { TransformationService } from 'app/transformation.service';

@Component({
  selector: 'make-dataset',
  templateUrl: './make-dataset.component.html',
  styleUrls: ['./make-dataset.component.css'],
  providers: []
})

export class MakeDatasetComponent implements OnInit {

  modalEnabled = false;

  private currentlySelectedFunctionSubscription: Subscription;
  private currentlySelectedFunction: any;

  private pipelineEventsSubscription: Subscription;
  private pipelineEvent: any;

  private previewedDataSubscription: Subscription;
  private previewedDataColumns: any;

  private makedatasetmode: String = '';
  private columnsArray: any = [];
  private useLazy = false;
  private moveFirstRowToHeader: boolean;
  private numberOfColumns: Number = 0;
  private docstring: String = '';

  constructor(private pipelineEventsSvc: PipelineEventsService, private transformationSvc: TransformationService) {}

  ngOnInit() {
    this.modalEnabled = false;
    // _this used only for Chrome debugger purposes... (WHY!?) ;-(
    //    const _this = this;
    //    this.initFunction();
    this.currentlySelectedFunctionSubscription = this.pipelineEventsSvc.currentlySelectedFunction.subscribe((selFunction) => {
      this.currentlySelectedFunction = selFunction.currentFunction;
    });

    this.pipelineEventsSubscription = this.pipelineEventsSvc.currentPipelineEvent.subscribe((currentEvent) => {
      if (currentEvent.startEdit && this.currentlySelectedFunction.__type === 'MakeDatasetFunction') {
        this.modalEnabled = true;
        this.useLazy = this.currentlySelectedFunction.useLazy;
        this.docstring = this.currentlySelectedFunction.docstring;
        // determine the mode
        if (this.currentlySelectedFunction.moveFirstRowToHeader) {
          this.makedatasetmode = 'firstrow';
        } else if (this.currentlySelectedFunction.numberOfColumns !== undefined) {
          this.numberOfColumns = this.currentlySelectedFunction.numberOfColumns;
          this.makedatasetmode = 'ncolumns';
        } else {
          this.makedatasetmode = 'colnames';
          this.columnsArray = this.currentlySelectedFunction.columnsArray.map(o => o.value);
        }
      }
    });

    this.previewedDataSubscription = this.transformationSvc.currentGraftwerkData
      .subscribe((previewedData) => {
      if (previewedData[':column-names']) {
        this.previewedDataColumns = previewedData[':column-names'].map(o => o.substring(1, o.length));
        console.log(this.previewedDataColumns);
      }
    });
  }

  //  initFunction() {
  //    this.function = new transformationDataModel.MakeDatasetFunction(
  //      null, null, null, null, null);
  //  }

  //  ngOnChanges(changes: SimpleChanges) {
  //    if (changes.function) {
  //      if (!this.function) {
  //        // console.log('New function');
  //      } else {
  //        console.log('Edit function');
  //        console.log(this.function)
  //        if (this.function.__type === 'MakeDatasetFunction') {
  //          this.columnsArray = this.function.columnsArray.map(o => o.value);
  //          this.useLazy = this.function.useLazy;
  //          this.numberOfColumns = this.function.numberOfColumns;
  //          this.moveFirstRowToHeader = this.function.moveFirstRowToHeader;
  //          if (this.moveFirstRowToHeader) {
  //            this.makedatasetmode = 'firstrow';
  //          } else { this.makedatasetmode = 'colnames' }
  //        }
  //        this.docstring = this.function.docstring;
  //      }
  //    }
  //  }

  accept() {
    switch (this.makedatasetmode) {
      case 'colnames': {
        this.currentlySelectedFunction.columnsArray = [];
        let index = 0;
        for (const col of this.columnsArray) {
          this.currentlySelectedFunction.columnsArray.push({ id: index, value: col });
          index++;
        }
        this.currentlySelectedFunction.useLazy = false;
        this.currentlySelectedFunction.numberOfColumns = this.numberOfColumns;
        this.currentlySelectedFunction.moveFirstRowToHeader = false;
        this.currentlySelectedFunction.docstring = this.docstring;
        break;
      }
      case 'ncolumns': {
        this.currentlySelectedFunction.columnsArray = this.columnsArray;
        this.currentlySelectedFunction.useLazy = true;
        this.currentlySelectedFunction.numberOfColumns = this.numberOfColumns;
        this.currentlySelectedFunction.moveFirstRowToHeader = false;
        this.currentlySelectedFunction.docstring = this.docstring;
        break;
      }
      case 'firstrow': {
        this.currentlySelectedFunction.columnsArray = [];
        this.currentlySelectedFunction.useLazy = false;
        this.currentlySelectedFunction.numberOfColumns = this.numberOfColumns;
        this.currentlySelectedFunction.moveFirstRowToHeader = true;
        this.currentlySelectedFunction.docstring = this.docstring;
        break;
      }
    }
    // change event
    // change selected function
    this.modalEnabled = false;
  }

  cancel() {
    // change event
    this.modalEnabled = false;
  }

}
