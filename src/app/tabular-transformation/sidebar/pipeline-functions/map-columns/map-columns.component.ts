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

  // private previewedTransformationSubscription: Subscription;
  private transformationObjSourceSubscription: Subscription;
  private previewedDataSubscription: Subscription;

  colToMapFrom: any;
  keyFunctionPairs: any;
  selectedCustomFunction: any;
  selectedCustomFunctionParams: any[] = [];
  previewedDataColumns: any = [];
  customFunctions: any[] = [];
  docstring: string = 'Map column';

  constructor(private pipelineEventsSvc: PipelineEventsService, private transformationSvc: TransformationService) { }

  ngOnInit() {

    this.transformationObjSourceSubscription = this.transformationSvc.transformationObjSource.subscribe((transformation) => {
      if (transformation) {
        this.customFunctions = transformation.customFunctionDeclarations.map((v, idx) => {
          return { id: idx, clojureCode: v.clojureCode, group: v.group, name: v.name };
        });
      }
    });

    this.currentlySelectedFunctionSubscription = this.pipelineEventsSvc.currentlySelectedFunction.subscribe((selFunction) => {
      this.currentlySelectedFunction = selFunction.currentFunction;
      console.log(this.currentlySelectedFunction);
    });

    this.pipelineEventsSubscription = this.pipelineEventsSvc.currentPipelineEvent.subscribe((currentEvent) => {
      this.pipelineEvent = currentEvent;
      // In case we clicked edit
      if (currentEvent.startEdit && this.currentlySelectedFunction.__type === 'MapcFunction') {
        this.modalEnabled = true;
        this.keyFunctionPairs = this.currentlySelectedFunction.keyFunctionPairs["0"];
        this.selectedCustomFunction = this.keyFunctionPairs.func;
        this.selectedCustomFunctionParams = this.keyFunctionPairs.funcParams;
        this.colToMapFrom = this.keyFunctionPairs.key;
        for (let column of this.previewedDataColumns) {
          if (this.colToMapFrom.id === column.id) {
            this.previewedDataColumns[column.id] = this.colToMapFrom;
          }
        }
        for (let funct of this.customFunctions) {
          if (this.selectedCustomFunction.id === funct.id) {
            this.selectedCustomFunction = funct;
            this.keyFunctionPairs.func = this.customFunctions[funct.id];
          }
        }
        this.docstring = this.currentlySelectedFunction.docstring;
      }
      // In case we clicked to add a new data cleaning step
      if (currentEvent.createNew && currentEvent.newStepType === 'MapcFunction') {
        this.modalEnabled = true;
        this.keyFunctionPairs = new transformationDataModel.KeyFunctionPair({}, {}, []);
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
    this.transformationObjSourceSubscription.unsubscribe();
    this.pipelineEventsSubscription.unsubscribe();
    this.currentlySelectedFunctionSubscription.unsubscribe();
  }

  setFunction() {
    if (this.keyFunctionPairs) {
      this.keyFunctionPairs.func = this.selectedCustomFunction;
    }
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
      // this.keyFunctionPairs = [new transformationDataModel.KeyFunctionPair(this.colToMapFrom, this.selectedCustomFunction, [])];
      this.keyFunctionPairs.func = this.selectedCustomFunction;
      this.keyFunctionPairs.funcParams = this.selectedCustomFunctionParams;
      this.keyFunctionPairs.key = this.colToMapFrom;
      const newFunction = new transformationDataModel.MapcFunction([this.keyFunctionPairs], this.docstring);

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
    console.log(instanceObj);
    let keyFunctionPairs = instanceObj.keyFunctionPairs["0"];
    console.log(keyFunctionPairs.getParams());
    console.log(keyFunctionPairs.getParams().length);
    keyFunctionPairs.key = this.colToMapFrom;
    keyFunctionPairs.func = this.selectedCustomFunction;
    console.log(keyFunctionPairs.getParams().length);
    console.log(keyFunctionPairs.funcParams.length);
    if (keyFunctionPairs.getParams().length < keyFunctionPairs.funcParams.length) {
      keyFunctionPairs.funcParams = this.selectedCustomFunctionParams.splice(keyFunctionPairs.getParams().length);
    }
    else if (keyFunctionPairs.getParams().length) {
      keyFunctionPairs.funcParams = this.selectedCustomFunctionParams;
    }
    else {
      keyFunctionPairs.funcParams = [];
    }
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
    this.selectedCustomFunctionParams = [];
    this.docstring = 'Map column';
  }

  cancel() {
    this.resetModal();
  }

}