import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import * as transformationDataModel from '../../../../../assets/transformationdatamodel.js';
import { PipelineEventsService } from 'app/tabular-transformation/pipeline-events.service';
import { TransformationService } from 'app/transformation.service';

@Component({
  selector: 'utility-function',
  templateUrl: './utility-function.component.html',
  styleUrls: ['./utility-function.component.css']
})

export class UtilityFunctionComponent implements OnInit {

  private modalEnabled: boolean = false;
  private currentlySelectedFunctionSubscription: Subscription;
  private currentlySelectedFunction: any;
  private pipelineEventsSubscription: Subscription;
  private pipelineEvent: any = { startEdit: false };
  private previewedTransformationSubscription: Subscription;
  private selectedCustomFunction: any;
  private docstring: string = 'Custom utility function';
  private customFunctions: any[] = [];
  private functParams: any[] = [];
  private functionName: any; //FunctionWithArgs

  constructor(private pipelineEventsSvc: PipelineEventsService, private transformationSvc: TransformationService) { }

  ngOnInit() {

    this.functionName = new transformationDataModel.FunctionWithArgs(this.selectedCustomFunction, [null]);

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
      if (currentEvent.startEdit && this.currentlySelectedFunction.__type === 'UtilityFunction') {
        this.modalEnabled = true;
        this.functParams = this.currentlySelectedFunction.functionName.functParams;
        this.selectedCustomFunction = this.currentlySelectedFunction.functionName.funct;
        for (let funct of this.customFunctions) {
          if (this.selectedCustomFunction.id === funct.id) {
            this.customFunctions[funct.id] = this.selectedCustomFunction;
          }
        }
        this.docstring = this.currentlySelectedFunction.docstring;
      }
      // In case we clicked to add a new data cleaning step
      if (currentEvent.createNew && currentEvent.newStepType === 'UtilityFunction') {
        this.modalEnabled = true;
      }
    });

  }

  ngOnDestroy() {
    this.previewedTransformationSubscription.unsubscribe();
    this.pipelineEventsSubscription.unsubscribe();
    this.currentlySelectedFunctionSubscription.unsubscribe();
  }

  private accept() {
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
      this.functionName = new transformationDataModel.FunctionWithArgs(this.selectedCustomFunction, this.functParams);
      const newFunction = new transformationDataModel.UtilityFunction(this.functionName, this.docstring);

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
    instanceObj.functionName.funct = this.selectedCustomFunction;
    instanceObj.functionName.functParams = this.functParams;
    instanceObj.docstring = this.docstring;
  }

  private resetModal() {
    // resets modal selection from selectbox
    this.pipelineEventsSvc.changePipelineEvent({
      cancel: true
    });
    this.modalEnabled = false;
    // resets the fields of the modal
    this.selectedCustomFunction = null;
    this.functParams = [null];
    this.docstring = 'Custom utility function';
  }

  private cancel() {
    this.resetModal();
  }

}