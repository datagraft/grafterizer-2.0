import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import * as transformationDataModel from '../../../../../assets/transformationdatamodel.js';
import { PipelineEventsService } from 'app/tabular-transformation/pipeline-events.service';
import { TransformationService } from 'app/transformation.service';

@Component({
  selector: 'derive-column',
  templateUrl: './derive-column.component.html',
  styleUrls: ['./derive-column.component.css']
})

export class DeriveColumnComponent implements OnInit {

  modalEnabled: boolean = false;

  private currentlySelectedFunctionSubscription: Subscription;
  private currentlySelectedFunction: any;

  private pipelineEventsSubscription: Subscription;
  private pipelineEvent: any = { startEdit: false };

  private transformationObjSourceSubscription: Subscription;
  private previewedDataSubscription: Subscription;

  newColName: string;
  functionsToDeriveWith: any[] = [];
  previewedDataColumns: string[] = [];
  customFunctions: any[] = [];
  colsToDeriveFrom: any[] = [];
  docstring: string = 'Derive column';

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
      if (currentEvent.startEdit && this.currentlySelectedFunction.__type === 'DeriveColumnFunction') {
        this.modalEnabled = true;
        this.newColName = this.currentlySelectedFunction.newColName;
        this.functionsToDeriveWith = this.currentlySelectedFunction.functionsToDeriveWith;
        this.colsToDeriveFrom = this.currentlySelectedFunction.colsToDeriveFrom;
        this.docstring = this.currentlySelectedFunction.docstring;
      }
      // In case we clicked to add a new data cleaning step
      if (currentEvent.createNew && currentEvent.newStepType === 'DeriveColumnFunction') {
        this.modalEnabled = true;
        this.addFunctionWithArgs();
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

  addFunctionWithArgs() {
    let functionWithArgs = new transformationDataModel.FunctionWithArgs({}, []);
    this.functionsToDeriveWith.push(functionWithArgs);
  }

  removeFunction(id: number) {
    if (this.functionsToDeriveWith.length > 1) {
      this.functionsToDeriveWith.splice(id, 1);
    }
  }

  accept() {
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
      const newFunction = new transformationDataModel.DeriveColumnFunction(this.newColName, this.colsToDeriveFrom, this.functionsToDeriveWith, this.docstring);

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
    for (let functionWithArgs of this.functionsToDeriveWith) {
      if (!functionWithArgs.getParams().length) {
        functionWithArgs.functParams = [];
      }
    }
    instanceObj.newColName = this.newColName;
    instanceObj.colsToDeriveFrom = this.colsToDeriveFrom;
    instanceObj.functionsToDeriveWith = this.functionsToDeriveWith;
    instanceObj.docstring = this.docstring;
  }

  private resetModal() {
    // resets modal selection from selectbox
    this.pipelineEventsSvc.changePipelineEvent({
      cancel: true
    });
    this.modalEnabled = false;
    // resets the fields of the modal
    this.newColName = null;
    this.functionsToDeriveWith = [];
    this.colsToDeriveFrom = null;
    this.docstring = 'Derive column';
  }

  cancel() {
    this.resetModal();
  }

}
