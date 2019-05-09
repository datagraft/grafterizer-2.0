import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import * as transformationDataModel from '../../../../../assets/transformationdatamodel.js';
import { PipelineEventsService } from 'app/tabular-transformation/pipeline-events.service';
import { TransformationService } from 'app/transformation.service';

@Component({
  selector: 'map-columns',
  templateUrl: './map-columns.component.html',
  styleUrls: ['./map-columns.component.css']
})

export class MapColumnsComponent implements OnInit {

  modalEnabled: boolean = false;

  private currentlySelectedFunctionSubscription: Subscription;
  private currentlySelectedFunction: any;

  private pipelineEventsSubscription: Subscription;
  private pipelineEvent: any = { startEdit: false };

  private previewedTransformationSubscription: Subscription;
  private previewedDataSubscription: Subscription;

  selectedCustomFunction: any;
  docstring: string = 'Derive column';
  previewedDataColumns: any = [];
  customFunctions: any[] = [];
  colToMapFrom: any;
  private keyFunctionPairs: any = [];

  constructor(private pipelineEventsSvc: PipelineEventsService, private transformationSvc: TransformationService) { }

  ngOnInit() {

    this.previewedTransformationSubscription = this.transformationSvc.previewedTransformationObjSource.subscribe((previewedTransformation) => {
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
      if (currentEvent.startEdit && this.currentlySelectedFunction.__type === 'MapcFunction') {
        this.modalEnabled = true;
        this.colToMapFrom = this.currentlySelectedFunction.keyFunctionPairs
        ["0"].key;
        for (let column of this.previewedDataColumns) {
          if (this.colToMapFrom.id === column.id) {
            this.previewedDataColumns[column.id] = this.colToMapFrom;
          }
        }
        this.selectedCustomFunction = this.currentlySelectedFunction.keyFunctionPairs
        ["0"].func;
        for (let funct of this.customFunctions) {
          if (this.selectedCustomFunction.id === funct.id) {
            this.customFunctions[funct.id] = this.selectedCustomFunction;
          }
        }
        this.docstring = this.currentlySelectedFunction.docstring;
      }
      // In case we clicked to add a new data cleaning step
      if (currentEvent.createNew && currentEvent.newStepType === 'MapcFunction') {
        this.modalEnabled = true;
      }
    });

    this.previewedDataSubscription = this.transformationSvc.graftwerkDataSource
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

  accept() {
    if (this.pipelineEvent.startEdit) {
      // change currentlySelectedFunction according to the user choices
      this.editMapColumnsFunction(this.currentlySelectedFunction);

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
      this.keyFunctionPairs = [new transformationDataModel.KeyFunctionPair(this.colToMapFrom, this.selectedCustomFunction, [])];
      const newFunction = new transformationDataModel.MapcFunction(this.keyFunctionPairs, this.docstring);

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

  private editMapColumnsFunction(instanceObj): any {
    instanceObj.keyFunctionPairs["0"].key = this.colToMapFrom;
    instanceObj.keyFunctionPairs["0"].func = this.selectedCustomFunction;
    instanceObj.docstring = this.docstring;
  }

  private resetModal() {
    // resets modal selection from selectbox
    this.pipelineEventsSvc.changePipelineEvent({
      cancel: true
    });
    this.modalEnabled = false;
    // resets the fields of the modal
    this.colToMapFrom = null;
    this.selectedCustomFunction = null;
    this.docstring = 'Map column';
  }

  cancel() {
    this.resetModal();
  }

}