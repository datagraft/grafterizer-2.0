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

  private transformationObjSourceSubscription: Subscription;
  private previewedDataSubscription: Subscription;

  keyFunctionPairs: any[] = [];
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
    });

    this.pipelineEventsSubscription = this.pipelineEventsSvc.currentPipelineEvent.subscribe((currentEvent) => {
      this.pipelineEvent = currentEvent;
      // In case we clicked edit
      if (currentEvent.startEdit && this.currentlySelectedFunction.__type === 'MapcFunction') {
        this.modalEnabled = true;
        this.keyFunctionPairs = this.currentlySelectedFunction.keyFunctionPairs;
        this.docstring = this.currentlySelectedFunction.docstring;
      }
      // In case we clicked to add a new data cleaning step
      if (currentEvent.createNew && currentEvent.newStepType === 'MapcFunction') {
        this.modalEnabled = true;
        this.addMapping();
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

  addMapping() {
    let keyFunctionPair = new transformationDataModel.KeyFunctionPair({}, {}, []);
    this.keyFunctionPairs.push(keyFunctionPair);
  }

  removeMapping(id: number) {
    if (this.keyFunctionPairs.length > 1) {
      this.keyFunctionPairs.splice(id, 1);
    }
  }

  incrementMapping(id) {
    return id += 1;
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
    for (let keyFunctionPair of this.keyFunctionPairs) {
      if (keyFunctionPair.getParams().length === 0) {
        keyFunctionPair.funcParams = [];
      }
    }
    instanceObj.keyFunctionPairs = this.keyFunctionPairs.filter((value, index, arr) => {
      return value.func.id !== undefined && value.key.id !== undefined;
    })
    instanceObj.docstring = this.docstring;
  }

  private resetModal() {
    // resets modal selection from selectbox
    this.pipelineEventsSvc.changePipelineEvent({
      cancel: true
    });
    this.keyFunctionPairs = [];
    this.modalEnabled = false;
    this.docstring = 'Map column';
  }

  cancel() {
    this.resetModal();
  }

}