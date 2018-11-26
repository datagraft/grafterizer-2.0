import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import * as transformationDataModel from '../../../../../assets/transformationdatamodel.js';
import { PipelineEventsService } from 'app/tabular-transformation/pipeline-events.service';
import { TransformationService } from 'app/transformation.service';


@Component({
  selector: 'sort-dataset',
  templateUrl: './sort-dataset.component.html',
  styleUrls: ['./sort-dataset.component.css']
})

export class SortDatasetComponent implements OnInit {

  private modalEnabled: boolean = false;

  private currentlySelectedFunctionSubscription: Subscription;
  private currentlySelectedFunction: any;

  private pipelineEventsSubscription: Subscription;
  private pipelineEvent: any = { startEdit: false };

  private previewedDataSubscription: Subscription;

  private sortTypes: string[] = ["Alphabetical", "Numerical", "By length", "Date"];
  private selectedColumn: any;
  private order: boolean = false;
  private sorttype: any;
  private colnamesSorttypesMap: any[] = [];
  private previewedDataColumns: any[] = [];
  private docstring: string = 'Sort column';

  constructor(private pipelineEventsSvc: PipelineEventsService, private transformationSvc: TransformationService) { }

  ngOnInit() {

    this.currentlySelectedFunctionSubscription = this.pipelineEventsSvc.currentlySelectedFunction.subscribe((selFunction) => {
      this.currentlySelectedFunction = selFunction.currentFunction;
    });

    this.previewedDataSubscription = this.transformationSvc.currentGraftwerkData
      .subscribe((previewedData) => {
        if (previewedData[':column-names']) {
          this.previewedDataColumns = previewedData[':column-names'].map((v, idx) => {
            return { id: idx, value: v.substring(1, v.length) };
          });
        }
      });

    this.pipelineEventsSubscription = this.pipelineEventsSvc.currentPipelineEvent.subscribe((currentEvent) => {
      this.pipelineEvent = currentEvent;
      // In case we clicked edit
      if (currentEvent.startEdit && this.currentlySelectedFunction.__type === 'SortDatasetFunction') {
        this.modalEnabled = true;
        this.colnamesSorttypesMap = this.currentlySelectedFunction.colnamesSorttypesMap;
        this.selectedColumn = this.colnamesSorttypesMap[0].colname;
        for (let col of this.previewedDataColumns) {
          if (this.selectedColumn.id === col.id) {
            this.previewedDataColumns[col.id] = this.selectedColumn.id;
          }
        }
        this.order = this.colnamesSorttypesMap[0].order;
        this.sorttype = this.colnamesSorttypesMap[0].sorttype;
        this.docstring = this.currentlySelectedFunction.docstring;
      }
      // In case we clicked to add a new data cleaning step
      if (currentEvent.createNew && currentEvent.newStepType === 'SortDatasetFunction') {
        this.modalEnabled = true;
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
      this.editSortColumnsFunction(this.currentlySelectedFunction);

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
      this.colnamesSorttypesMap.push(new transformationDataModel.ColnameSorttype(this.selectedColumn, this.sorttype, this.order));
      const newFunction = new transformationDataModel.SortDatasetFunction(this.colnamesSorttypesMap, this.docstring);

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

  private editSortColumnsFunction(instanceObj): any {
    for (let obj of instanceObj.colnamesSorttypesMap) {
      obj.colname = this.selectedColumn;
      obj.order = this.order;
      obj.sorttype = this.sorttype;
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
    this.selectedColumn = null;
    this.sorttype = null;
    this.order = null;
    this.docstring = 'Sort column';
  }

  private cancel() {
    this.resetModal();
  }

}
