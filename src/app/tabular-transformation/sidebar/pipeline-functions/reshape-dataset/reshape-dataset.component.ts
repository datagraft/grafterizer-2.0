import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import * as transformationDataModel from '../../../../../assets/transformationdatamodel.js';
import { PipelineEventsService } from 'app/tabular-transformation/pipeline-events.service';
import { TransformationService } from 'app/transformation.service';

@Component({
  selector: "reshape-dataset",
  templateUrl: "./reshape-dataset.component.html",
  styleUrls: ["./reshape-dataset.component.css"]
})

export class ReshapeDatasetComponent implements OnInit {

  private modalEnabled: boolean = false;

  private currentlySelectedFunctionSubscription: Subscription;
  private currentlySelectedFunction: any;

  private pipelineEventsSubscription: Subscription;
  private pipelineEvent: any = { startEdit: false };

  private previewedTransformationSubscription: Subscription;
  private previewedDataSubscription: Subscription;

  private docstring: string = 'Reshape dataset';
  private previewedDataColumns: any = [];
  private columnsArray: any[] = [];
  private aggrFunction: any[] = null;
  private variable: string = null;
  private value: string = null;
  private separator: string = null;

  private reshapedatasetmode: string = 'melt';

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
        this.aggrFunction = this.currentlySelectedFunction.aggrFunction;
        this.columnsArray = this.currentlySelectedFunction.columnsArray;
        this.separator = this.currentlySelectedFunction.separator;
        this.value = this.currentlySelectedFunction.value;
        this.variable = this.currentlySelectedFunction.variable;

        // this.selectedCustomFunction = this.currentlySelectedFunction.keyFunctionPairs
        // ["0"].func;
        // for (let funct of this.customFunctions) {
        //   if (this.selectedCustomFunction.id === funct.id) {
        //     this.customFunctions[funct.id] = this.selectedCustomFunction;
        //   }
        // }
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
    this.docstring = 'Map column';
  }

  private cancel() {
    this.resetModal();
  }

}
