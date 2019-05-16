import { Component, OnInit } from '@angular/core';

import * as transformationDataModel from '../../../../../assets/transformationdatamodel.js';
import { Subscription } from 'rxjs';
import { PipelineEventsService } from 'app/tabular-transformation/pipeline-events.service';
import { TransformationService } from 'app/transformation.service';

@Component({
  selector: 'filter-rows',
  templateUrl: './filter-rows.component.html',
  styleUrls: ['./filter-rows.component.css']
})

export class FilterRowsComponent implements OnInit {

  modalEnabled: boolean = false;

  private currentlySelectedFunctionSubscription: Subscription;
  private currentlySelectedFunction: any;

  private pipelineEventsSubscription: Subscription;
  private pipelineEvent: any;

  private previewedTransformationSubscription: Subscription;
  private previewedDataSubscription: Subscription;
  previewedDataColumns: any;

  colsToFilter: string[] = [];
  private filterText: string = null;
  private filterRegex: string = null;
  private ignoreCase: boolean = false;
  private take: boolean = true;
  grepmode: string = 'text';
  private customFunctions: any[] = [];
  private functionsToFilterWith: any[] = [];
  private selectedCustomFunction: any;
  docstring: string = 'Filter rows';

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
      if (currentEvent.startEdit && this.currentlySelectedFunction.__type === 'GrepFunction') {
        this.modalEnabled = true;
        this.take = this.currentlySelectedFunction.take;
        this.grepmode = this.currentlySelectedFunction.grepmode;
        this.colsToFilter = this.currentlySelectedFunction.colsToFilter.map(o => o.value);
        this.selectedCustomFunction = this.currentlySelectedFunction.functionsToFilterWith["0"];
        if (this.selectedCustomFunction) {
          for (let funct of this.customFunctions) {
            if (this.selectedCustomFunction.id === funct.id) {
              this.customFunctions[funct.id] = this.selectedCustomFunction;
            }
          }
        }
        this.filterText = this.currentlySelectedFunction.filterText;
        this.filterRegex = this.currentlySelectedFunction.filterRegex;
        this.ignoreCase = this.currentlySelectedFunction.ignoreCase;
        this.docstring = this.currentlySelectedFunction.docstring;
      }
      // In case we clicked to add a new data cleaning step
      if (currentEvent.createNew && currentEvent.newStepType === 'GrepFunction') {
        this.modalEnabled = true;
      }
    });

    this.previewedDataSubscription = this.transformationSvc.graftwerkDataSource
      .subscribe((previewedData) => {
        if (previewedData[':column-names']) {
          this.previewedDataColumns = previewedData[':column-names'].map(o => {
            return o.charAt(0) == ':' ? o.substr(1) : o;
          });
        }
      });
  }

  accept() {
    if (this.pipelineEvent.startEdit) {
      // change currentlySelectedFunction according to the user choices
      this.createFilterRowsFunction(this.currentlySelectedFunction);

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
      // create empty object
      const newFunction = new transformationDataModel.GrepFunction(this.take, this.grepmode, this.colsToFilter, this.functionsToFilterWith, this.filterText, this.filterRegex, this.ignoreCase, this.docstring);

      // apply user choices to the empty object
      this.createFilterRowsFunction(newFunction);

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

  private createFilterRowsFunction(instanceObj): any {
    instanceObj.take = this.take;
    instanceObj.grepmode = this.grepmode;
    instanceObj.colsToFilter = [];
    for (let c of this.colsToFilter) {
      instanceObj.colsToFilter.push({ id: 0, value: c });
    }
    this.functionsToFilterWith["0"] = (this.selectedCustomFunction);
    instanceObj.functionsToFilterWith = this.functionsToFilterWith;
    instanceObj.filterText = this.filterText;
    instanceObj.filterRegex = this.filterRegex;
    instanceObj.ignoreCase = this.ignoreCase;
    instanceObj.docstring = this.docstring;
  }

  resetModal() {
    // resets modal selection from selectbox
    this.pipelineEventsSvc.changePipelineEvent({
      cancel: true
    });
    this.modalEnabled = false;
    // resets the fields of the modal
    this.colsToFilter = null;
    this.filterText = null;
    this.filterRegex = null;
    this.ignoreCase = false;
    this.take = true;
    this.selectedCustomFunction = null;
    this.grepmode = 'text';
    this.docstring = 'Filter rows';
  }

  /*   addFilterFunction() {
      this.functionsToFilterWith.push(null);
    }
  
    removeFilterFunction(idx) {
      this.functionsToFilterWith.splice(idx, 1);
    }
  
    findCustomFunctionByName(functionName) {
      for (let funct of this.customFunctions) {
        if (functionName === funct.name) {
          console.log(funct)
          return funct;
        }
      }
    } */

}