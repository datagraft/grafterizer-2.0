import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import * as transformationDataModel from '../../../../../assets/transformationdatamodel.js';
import { PipelineEventsService } from 'app/tabular-transformation/pipeline-events.service';
import { TransformationService } from 'app/transformation.service';


@Component({
  selector: 'shift-row',
  templateUrl: './shift-row.component.html',
  styleUrls: ['./shift-row.component.css']
})

export class ShiftRowComponent implements OnInit {

  modalEnabled: boolean = false;

  indexFrom: string = null;
  indexTo: string = null;
  shiftrowmode: string = 'eods';
  docstring: string = 'Shift (move) row';

  private currentlySelectedFunctionSubscription: Subscription;
  private currentlySelectedFunction: any;

  private pipelineEventsSubscription: Subscription;
  private pipelineEvent: any = { startEdit: false };

  constructor(private pipelineEventsSvc: PipelineEventsService, private transformationSvc: TransformationService) { }

  ngOnInit() {

    this.currentlySelectedFunctionSubscription = this.pipelineEventsSvc.currentlySelectedFunction.subscribe((selFunction) => {
      this.currentlySelectedFunction = selFunction.currentFunction;
    });

    this.pipelineEventsSubscription = this.pipelineEventsSvc.currentPipelineEvent.subscribe((currentEvent) => {
      this.pipelineEvent = currentEvent;
      // In case we clicked edit
      if (currentEvent.startEdit && this.currentlySelectedFunction.__type === 'ShiftRowFunction') {
        this.modalEnabled = true;
        this.indexFrom = this.currentlySelectedFunction.indexFrom;
        this.indexTo = this.currentlySelectedFunction.indexTo;
        this.shiftrowmode = this.currentlySelectedFunction.shiftrowmode;
        this.docstring = this.currentlySelectedFunction.docstring;
      }
      // In case we clicked to add a new data cleaning step
      if (currentEvent.createNew && currentEvent.newStepType === 'ShiftRowFunction') {
        this.modalEnabled = true;
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
      this.editShiftRowFunction(this.currentlySelectedFunction);

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
      // create object with user input
      const newFunction = new transformationDataModel.ShiftRowFunction(
        parseInt(this.indexFrom), parseInt(this.indexTo), this.shiftrowmode, this.docstring);
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

  private editShiftRowFunction(instanceObj): any {
    instanceObj.indexFrom = parseInt(this.indexFrom);
    instanceObj.indexTo = parseInt(this.indexTo);
    instanceObj.shiftrowmode = this.shiftrowmode;
    instanceObj.docstring = this.docstring;
  }

  private resetModal() {
    // resets modal selection from selectbox
    this.pipelineEventsSvc.changePipelineEvent({
      cancel: true
    });
    this.modalEnabled = false;
    // resets the fields of the modal
    this.indexFrom = null;
    this.indexTo = null;
    this.shiftrowmode = 'eods';
    this.docstring = 'Shift (move) row';
  }

  cancel() {
    this.resetModal();
  }

}
