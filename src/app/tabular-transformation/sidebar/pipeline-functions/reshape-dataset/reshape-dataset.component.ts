import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import * as transformationDataModel from '../../../../../assets/transformationdatamodel.js';
import { PipelineEventsService } from 'app/tabular-transformation/pipeline-events.service';
import { TransformationService } from 'app/transformation.service';

@Component({
  selector: "reshape-dataset",
  templateUrl: "./reshape-dataset.component.html",
  styleUrls: ["./reshape-dataset.component.css"]
})

export class ReshapeDatasetComponent implements OnInit {

  private currentlySelectedFunctionSubscription: Subscription;
  private currentlySelectedFunction: any;

  private pipelineEventsSubscription: Subscription;
  private pipelineEvent: any = { startEdit: false };

  private previewedDataSubscription: Subscription;

  private modalEnabled: boolean = false;
  private reshapedatasetmode: string = 'melt';
  private previewedDataColumns: any = [];
  private columnsArray: any[] = [];
  private aggrFunctionArray: any[] = ['MIN', 'MAX', 'SUM', 'AVG', 'COUNT', 'COUNT-DISTINCT', 'MERGE'];
  private aggrFunction: string = null;
  private variable: string = null;
  private value: string = null;
  private separator: string = null;
  private docstring: string = 'Reshape dataset with melt or cast function';

  constructor(private pipelineEventsSvc: PipelineEventsService, private transformationSvc: TransformationService) { }

  ngOnInit() {

    this.currentlySelectedFunctionSubscription = this.pipelineEventsSvc.currentlySelectedFunction.subscribe((selFunction) => {
      this.currentlySelectedFunction = selFunction.currentFunction;
    });

    this.pipelineEventsSubscription = this.pipelineEventsSvc.currentPipelineEvent.subscribe((currentEvent) => {
      this.pipelineEvent = currentEvent;
      // In case we clicked edit
      if (currentEvent.startEdit && this.currentlySelectedFunction.__type === 'MeltFunction') {
        this.modalEnabled = true;
        this.reshapedatasetmode = this.currentlySelectedFunction.displayName;
        this.aggrFunction = this.currentlySelectedFunction.aggrFunction;
        this.columnsArray = this.currentlySelectedFunction.columnsArray;
        this.separator = this.currentlySelectedFunction.separator;
        this.value = this.currentlySelectedFunction.value;
        this.variable = this.currentlySelectedFunction.variable;
        this.docstring = this.currentlySelectedFunction.docstring;
      }
      // In case we clicked to add a new data cleaning step
      if (currentEvent.createNew && currentEvent.newStepType === 'MeltFunction') {
        this.modalEnabled = true;
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

  private accept() {
    if (this.pipelineEvent.startEdit) {
      // change currentlySelectedFunction according to the user choices
      this.editMeltFunction(this.currentlySelectedFunction);

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
      const newFunction = new transformationDataModel.MeltFunction(this.columnsArray, this.variable, this.value, this.aggrFunction, this.separator, this.docstring);

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

  private editMeltFunction(instanceObj): any {
    instanceObj.displayName = this.reshapedatasetmode;
    instanceObj.columnsArray = this.columnsArray;
    instanceObj.variable = this.variable;
    instanceObj.value = this.value;
    instanceObj.aggrFunction = this.aggrFunction;
    instanceObj.separator = this.separator;
    instanceObj.docstring = this.docstring;
  }

  private resetModal() {
    // resets modal selection from selectbox
    this.pipelineEventsSvc.changePipelineEvent({
      cancel: true
    });
    this.modalEnabled = false;
    // resets the fields of the modal
    this.columnsArray = null;
    this.aggrFunction = null;
    this.variable = null;
    this.value = null;
    this.docstring = 'Reshape dataset with melt or cast function';
  }

  private cancel() {
    this.resetModal();
  }

}
