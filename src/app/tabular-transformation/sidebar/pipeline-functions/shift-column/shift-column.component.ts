import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import * as transformationDataModel from '../../../../../assets/transformationdatamodel.js';
import { PipelineEventsService } from 'app/tabular-transformation/pipeline-events.service';
import { TransformationService } from 'app/transformation.service';


@Component({
  selector: 'shift-column',
  templateUrl: './shift-column.component.html',
  styleUrls: ['./shift-column.component.css']
})

export class ShiftColumnComponent implements OnInit {

  modalEnabled: boolean = false;

  colFrom: any;
  indexTo: string = null;
  shiftcolmode: string = 'eods';
  docstring: String = 'Shift (move) column';

  private currentlySelectedFunctionSubscription: Subscription;
  private currentlySelectedFunction: any;

  private pipelineEventsSubscription: Subscription;
  private pipelineEvent: any = { startEdit: false };

  private previewedDataSubscription: Subscription;
  previewedDataColumns: any[] = [];

  constructor(private pipelineEventsSvc: PipelineEventsService, private transformationSvc: TransformationService) { }

  ngOnInit() {

    this.currentlySelectedFunctionSubscription = this.pipelineEventsSvc.currentlySelectedFunction.subscribe((selFunction) => {
      this.currentlySelectedFunction = selFunction.currentFunction;
    });

    this.pipelineEventsSubscription = this.pipelineEventsSvc.currentPipelineEvent.subscribe((currentEvent) => {
      this.pipelineEvent = currentEvent;
      // In case we clicked edit
      if (currentEvent.startEdit && this.currentlySelectedFunction.__type === 'ShiftColumnFunction') {
        this.modalEnabled = true;
        this.colFrom = this.currentlySelectedFunction.colFrom;
        this.indexTo = this.currentlySelectedFunction.indexTo;
        this.shiftcolmode = this.currentlySelectedFunction.shiftcolmode;
        this.docstring = this.currentlySelectedFunction.docstring;
        for (let header of this.previewedDataColumns) {
          if (this.colFrom.id === header.id) {
            this.previewedDataColumns[header.id] = this.colFrom;
          }
        }
      }
      // In case we clicked to add a new data cleaning step
      if (currentEvent.createNew && currentEvent.newStepType === 'ShiftColumnFunction') {
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
    this.previewedDataSubscription.unsubscribe();
    this.pipelineEventsSubscription.unsubscribe();
    this.currentlySelectedFunctionSubscription.unsubscribe();
  }

  accept() {
    if (this.pipelineEvent.startEdit) {
      // change currentlySelectedFunction according to the user choices
      this.editShiftColumnFunction(this.currentlySelectedFunction);

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
    }
    else if (this.pipelineEvent.createNew) {
      if (this.colFrom === undefined) {
        this.colFrom = this.previewedDataColumns[0];
      }
      // create object with user input
      const newFunction = new transformationDataModel.ShiftColumnFunction(
        this.colFrom, parseInt(this.indexTo), this.shiftcolmode, this.docstring);

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

  private editShiftColumnFunction(instanceObj): any {
    instanceObj.colFrom = this.colFrom;
    instanceObj.indexTo = parseInt(this.indexTo);
    instanceObj.shiftcolmode = this.shiftcolmode;
    instanceObj.docstring = this.docstring;
  }

  private resetModal() {
    // resets modal selection from selectbox
    this.pipelineEventsSvc.changePipelineEvent({
      cancel: true
    });
    this.modalEnabled = false;
    // resets the fields of the modal
    this.colFrom = null;
    this.indexTo = null;
    this.shiftcolmode = 'eods';
    this.docstring = 'Shift (move) column';
  }

  cancel() {
    this.resetModal();
  }

}
