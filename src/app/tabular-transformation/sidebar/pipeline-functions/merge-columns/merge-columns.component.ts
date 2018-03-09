import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import * as transformationDataModel from '../../../../../assets/transformationdatamodel.js';
import { PipelineEventsService } from 'app/tabular-transformation/pipeline-events.service';
import { TransformationService } from 'app/transformation.service';


@Component({
  selector: 'merge-columns',
  templateUrl: './merge-columns.component.html',
  styleUrls: ['./merge-columns.component.css']
})

export class MergeColumnsComponent implements OnInit {

  private modalEnabled: boolean;
  private visible: boolean;

  private currentlySelectedFunctionSubscription: Subscription;
  private currentlySelectedFunction: any;

  private pipelineEventsSubscription: Subscription;
  private pipelineEvent: any = { startEdit: false };

  private previewedDataSubscription: Subscription;

  private separator: string;
  private newColName: string;
  private docstring: string;
  private previewedDataColumns: string[] = [];
  private colsToMerge: any[] = [];

  constructor(private pipelineEventsSvc: PipelineEventsService, private transformationSvc: TransformationService) { }

  ngOnInit() {

    this.modalEnabled = false;
    this.visible = false;

    this.currentlySelectedFunctionSubscription = this.pipelineEventsSvc.currentlySelectedFunction.subscribe((selFunction) => {
      this.currentlySelectedFunction = selFunction.currentFunction;
    });

    this.pipelineEventsSubscription = this.pipelineEventsSvc.currentPipelineEvent.subscribe((currentEvent) => {
      this.pipelineEvent = currentEvent;
      // In case we clicked edit
      if (currentEvent.startEdit && this.currentlySelectedFunction.__type === 'MergeColumnsFunction') {
        this.modalEnabled = true;
        this.newColName = this.currentlySelectedFunction.newColName;
        this.colsToMerge = this.currentlySelectedFunction.colsToMerge;
        this.separator = this.currentlySelectedFunction.separator;
        this.docstring = this.currentlySelectedFunction.docstring;
      }
      // In case we clicked to add a new data cleaning step
      if (currentEvent.createNew && currentEvent.newStepType === 'MergeColumnsFunction') {
        this.modalEnabled = true;
      }
      if (currentEvent.delete && currentEvent.newStepType === 'MergeColumnsFunction') {
        this.colsToMerge = [];
      }
    });

    this.previewedDataSubscription = this.transformationSvc.currentGraftwerkData
      .subscribe((previewedData) => {
        if (previewedData[':column-names']) {
          this.previewedDataColumns = previewedData[':column-names'].map((v, idx) => {
            return { id: idx, value: v.substring(1, v.length) };
          });
        }
      });
  }

  ngOnDestroy() {
    this.pipelineEventsSubscription.unsubscribe();
    this.currentlySelectedFunctionSubscription.unsubscribe();
  }

  setVisibleDropDown() {
    this.visible = true;
  }

  private accept() {
    if (this.pipelineEvent.startEdit) {
      // change currentlySelectedFunction according to the user choices
      this.editMergeColumnsFunction(this.currentlySelectedFunction);

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
      const newFunction = new transformationDataModel.MergeColumnsFunction(this.colsToMerge, this.separator, this.newColName, this.docstring);

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
    this.modalEnabled = false;
  }

  private editMergeColumnsFunction(instanceObj): any {
    instanceObj.newColName = this.newColName;
    instanceObj.colsToMerge = this.colsToMerge;
    instanceObj.separator = this.separator;
    instanceObj.docstring = this.docstring;
  }

  private resetModal() {
    // resets the fields of the modal
    this.newColName = null;
    this.separator = null;
    this.docstring = null;
  }

  private cancel() {
    this.resetModal();
    this.modalEnabled = false;
  }

}
