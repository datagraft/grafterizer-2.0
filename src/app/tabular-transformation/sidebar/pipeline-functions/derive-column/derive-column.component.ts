import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import * as transformationDataModel from '../../../../../assets/transformationdatamodel.js';
import { PipelineEventsService } from 'app/tabular-transformation/pipeline-events.service';
import { TransformationService } from 'app/transformation.service';

@Component({
  selector: 'derive-column',
  templateUrl: './derive-column.component.html',
  styleUrls: ['./derive-column.component.css']
})

export class DeriveColumnComponent implements OnInit {

  private modalEnabled: boolean;
  private visible: boolean;

  private currentlySelectedFunctionSubscription: Subscription;
  private currentlySelectedFunction: any;

  private pipelineEventsSubscription: Subscription;
  private pipelineEvent: any = { startEdit: false };

  private previewedTransformationSubscription: Subscription;
  private previewedDataSubscription: Subscription;

  private newColName: string;
  private selectedCustomFunction: any;
  private docstring: string;
  private previewedDataColumns: string[] = [];
  private customFunctions: any[] = [];
  private colsToDeriveFrom: any[] = [];

  constructor(private pipelineEventsSvc: PipelineEventsService, private transformationSvc: TransformationService) { }

  ngOnInit() {

    this.modalEnabled = false;
    this.visible = false;

    this.previewedTransformationSubscription = this.transformationSvc.currentPreviewedTransformationObj
      .subscribe((previewedTransformation) => {
        if (previewedTransformation) {
          this.customFunctions = previewedTransformation.customFunctionDeclarations.map((v, idx) => {
            return { id: idx, clojureCode: v.clojureCode, group: v.group, name: v.name };
          });
        }
      });

    this.currentlySelectedFunctionSubscription = this.pipelineEventsSvc.currentlySelectedFunction.subscribe((selFunction) => {
      this.currentlySelectedFunction = selFunction.currentFunction;
    });

    this.pipelineEventsSubscription = this.pipelineEventsSvc.currentPipelineEvent.subscribe((currentEvent) => {
      this.pipelineEvent = currentEvent;
      // In case we clicked edit
      if (currentEvent.startEdit && this.currentlySelectedFunction.__type === 'DeriveColumnFunction') {
        this.modalEnabled = true;
        this.newColName = this.currentlySelectedFunction.newColName;
        this.colsToDeriveFrom = this.currentlySelectedFunction.colsToDeriveFrom;
        this.selectedCustomFunction = this.currentlySelectedFunction.functionsToDeriveWith["0"].funct;
        for (let funct of this.customFunctions) {
          if (this.selectedCustomFunction.id === funct.id) {
            this.customFunctions[funct.id] = this.selectedCustomFunction;
          }
        }
        this.docstring = this.currentlySelectedFunction.docstring;
      }
      // In case we clicked to add a new data cleaning step
      if (currentEvent.createNew && currentEvent.newStepType === 'DeriveColumnFunction') {
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
    this.previewedTransformationSubscription.unsubscribe();
    this.pipelineEventsSubscription.unsubscribe();
    this.currentlySelectedFunctionSubscription.unsubscribe();
  }

  setVisibleDropDown() {
    this.visible = true;
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
      const newFunction = new transformationDataModel.DeriveColumnFunction(this.newColName, this.colsToDeriveFrom, [new transformationDataModel.FunctionWithArgs(this.selectedCustomFunction, [])], this.docstring);

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

  private editDeriveColumnsFunction(instanceObj): any {
    instanceObj.newColName = this.newColName;
    instanceObj.docstring = this.docstring;
    instanceObj.colsToDeriveFrom = this.colsToDeriveFrom;
    instanceObj.functionsToDeriveWith["0"].funct = this.selectedCustomFunction;
  }

  private resetModal() {
    // resets the fields of the modal
    this.newColName = null;
    this.docstring = null;
    this.selectedCustomFunction = null;
  }

  private cancel() {
    this.resetModal();
    this.modalEnabled = false;
  }

}
