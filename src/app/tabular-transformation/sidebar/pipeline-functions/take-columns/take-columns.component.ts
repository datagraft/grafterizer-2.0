import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import * as transformationDataModel from '../../../../../assets/transformationdatamodel.js';
import { PipelineEventsService } from 'app/tabular-transformation/pipeline-events.service';
import { TransformationService } from 'app/transformation.service';


@Component({
  selector: 'take-columns',
  templateUrl: './take-columns.component.html',
  styleUrls: ['./take-columns.component.css']
})

export class TakeColumnsComponent implements OnInit {

  modalEnabled: boolean = false;
  takecolumnsmode = 'colnames';

  private columnsArray: any[] = [];
  private indexFrom = null;
  private indexTo = null;
  take = true;
  docstring: string = 'Take columns';

  private currentlySelectedFunctionSubscription: Subscription;
  private currentlySelectedFunction: any;

  private pipelineEventsSubscription: Subscription;
  private pipelineEvent: any = { startEdit: false };

  private previewedDataSubscription: Subscription;
  private previewedDataColumns: string[] = [];

  constructor(private pipelineEventsSvc: PipelineEventsService, private transformationSvc: TransformationService) { }

  ngOnInit() {

    this.currentlySelectedFunctionSubscription = this.pipelineEventsSvc.currentlySelectedFunction.subscribe((selFunction) => {
      this.currentlySelectedFunction = selFunction.currentFunction;
    });

    this.pipelineEventsSubscription = this.pipelineEventsSvc.currentPipelineEvent.subscribe((currentEvent) => {
      this.pipelineEvent = currentEvent;
      // In case we clicked edit
      if (currentEvent.startEdit && this.currentlySelectedFunction.__type === 'ColumnsFunction') {
        this.modalEnabled = true;
        if (this.currentlySelectedFunction.indexFrom === null && this.currentlySelectedFunction.indexTo === null) {
          this.takecolumnsmode = 'colnames';
        }
        else {
          this.takecolumnsmode = 'indices';
          this.indexFrom = this.currentlySelectedFunction.indexFrom;
          this.indexTo = this.currentlySelectedFunction.indexTo;
        }
        this.columnsArray = this.currentlySelectedFunction.columnsArray;
        this.take = this.currentlySelectedFunction.take;
        this.docstring = this.currentlySelectedFunction.docstring;
      }
      // In case we clicked to add a new data cleaning step
      if (currentEvent.createNew && currentEvent.newStepType === 'ColumnsFunction') {
        this.takecolumnsmode = 'colnames';
        this.modalEnabled = true;
      }
    });

    this.previewedDataSubscription = this.transformationSvc.graftwerkDataSource
      .subscribe((previewedData) => {
        if (previewedData[':column-names']) {
          this.previewedDataColumns = previewedData[':column-names'].map((v, idx) => {
            return { id: idx, value: v.charAt(0) == ':' ? v.substr(1) : v };
          });
        }
      });
  }

  ngOnDestroy() {
    this.pipelineEventsSubscription.unsubscribe();
    this.currentlySelectedFunctionSubscription.unsubscribe();
  }

  accept() {
    if (this.pipelineEvent.startEdit) {
      // change currentlySelectedFunction according to the user choices
      this.editTakeColumnsFunction(this.currentlySelectedFunction);

      // notify of change in selected function
      this.pipelineEventsSvc.changeSelectedFunction({
        currentFunction: this.currentlySelectedFunction,
        changedFunction: this.currentlySelectedFunction
      });

      // notify of that we finished editing
      this.pipelineEventsSvc.changePipelineEvent({
        commitEdit: true,
        preview: true
      });
    } else if (this.pipelineEvent.createNew) {
      // create object with user input
      let newFunction = {};
      if (this.takecolumnsmode === 'colnames') {
        newFunction = new transformationDataModel.ColumnsFunction(this.columnsArray,
          null, null, this.take, this.docstring);

      } else if (this.takecolumnsmode === 'indices') {
        newFunction = new transformationDataModel.ColumnsFunction([],
          this.indexFrom, this.indexTo, this.take, this.docstring);
      } else {
        // nothing was selected - should not happen!
        console.error("Error! No mode selected for Take Columns function!");
        newFunction = new transformationDataModel.ColumnsFunction([],
          null, null, this.take, this.docstring);
      }

      // notify of change in selected function
      this.pipelineEventsSvc.changeSelectedFunction({
        currentFunction: this.currentlySelectedFunction,
        changedFunction: newFunction
      });

      // notify of that we finished creating
      this.pipelineEventsSvc.changePipelineEvent({
        commitCreateNew: true
      });
    } else {
      console.log('ERROR! Something bad happened!');
    }
    this.resetModal();
  }

  private editTakeColumnsFunction(instanceObj): any {
    // this check is necessary due to the badly coded ColumnsFunction in the TransformationDataModel (the mode of the function is determined by the attribute values)
    if (this.takecolumnsmode === 'colnames') {
      instanceObj.columnsArray = this.columnsArray;
      instanceObj.indexFrom = null;
      instanceObj.indexTo = null;
      instanceObj.take = this.take;
      instanceObj.docstring = this.docstring;
    } else if (this.takecolumnsmode === 'indices') {
      instanceObj.columnsArray = [];
      instanceObj.indexFrom = parseInt(this.indexFrom);
      instanceObj.indexTo = parseInt(this.indexTo);
      instanceObj.take = this.take;
      instanceObj.docstring = this.docstring;
    } else {
      // nothing was selected - should not happen!
      console.error("Error! No mode selected for Take Columns function!");
    }

  }

  private resetModal() {
    // resets modal selection from selectbox
    this.pipelineEventsSvc.changePipelineEvent({
      cancel: true
    });
    this.modalEnabled = false;
    // resets the fields of the modal
    this.columnsArray = [];
    this.indexFrom = null;
    this.indexTo = null;
    this.take = true;
    this.docstring = 'Take columns';
  }

  cancel() {
    this.resetModal();
  }

}
