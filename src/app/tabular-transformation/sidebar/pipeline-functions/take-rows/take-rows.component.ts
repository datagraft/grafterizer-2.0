import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import * as transformationDataModel from '../../../../../assets/transformationdatamodel.js';
import { PipelineEventsService } from 'app/tabular-transformation/pipeline-events.service';
import { TransformationService } from 'app/transformation.service';

@Component({
  selector: 'take-rows',
  templateUrl: './take-rows.component.html',
  styleUrls: ['./take-rows.component.css']
})

export class TakeRowsComponent implements OnInit {

  private modalEnabled: boolean = false;

  private indexFrom: string = null;
  private indexTo: string = null;
  private take: boolean = true;
  private docstring: string;

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
      if (currentEvent.startEdit && this.currentlySelectedFunction.__type === 'DropRowsFunction') {
        this.modalEnabled = true;
        this.indexFrom = this.currentlySelectedFunction.indexFrom;
        this.indexTo = this.currentlySelectedFunction.indexTo;
        this.take = this.currentlySelectedFunction.take;
        this.docstring = this.currentlySelectedFunction.docstring;
      }
      // In case we clicked to add a new data cleaning step
      if (currentEvent.createNew && currentEvent.newStepType === 'DropRowsFunction') {
        this.modalEnabled = true;
      }
    });
  }

  ngOnDestroy() {
    this.pipelineEventsSubscription.unsubscribe();
    this.currentlySelectedFunctionSubscription.unsubscribe();
  }

  private accept() {
    if (this.pipelineEvent.startEdit) {
      // change currentlySelectedFunction according to the user choices
      this.editDeriveColumnsFunction(this.currentlySelectedFunction);

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
      const newFunction = new transformationDataModel.DropRowsFunction(parseInt(this.indexFrom), parseInt(this.indexTo), this.take, this.docstring);

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

  private editDeriveColumnsFunction(instanceObj): any {
    instanceObj.indexFrom = parseInt(this.indexFrom);
    instanceObj.indexTo = parseInt(this.indexTo);
    instanceObj.take = this.take;
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
    this.take = true;
    this.docstring = null;
  }

  private cancel() {
    this.resetModal();
  }

}
