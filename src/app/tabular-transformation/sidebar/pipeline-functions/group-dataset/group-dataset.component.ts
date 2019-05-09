import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import * as transformationDataModel from '../../../../../assets/transformationdatamodel.js';
import { PipelineEventsService } from 'app/tabular-transformation/pipeline-events.service';
import { TransformationService } from 'app/transformation.service';

@Component({
  selector: 'group-dataset',
  templateUrl: './group-dataset.component.html',
  styleUrls: ['./group-dataset.component.css']
})

export class GroupDatasetComponent implements OnInit {

  modalEnabled: boolean = false;

  private currentlySelectedFunctionSubscription: Subscription;
  private currentlySelectedFunction: any;

  private pipelineEventsSubscription: Subscription;
  private pipelineEvent: any = { startEdit: false };

  private previewedDataSubscription: Subscription;

  previewedDataColumns: any = [];
  aggrTypes: String[] = ["MIN", "MAX", "SUM", "COUNT", "COUNT-DISTINCT", "AVG", "MERGE"];
  colnames: String[] = [];
  private colnamesFunctionsSet: String[] = [null, null];
  private separatorSet: any[] = [null];
  docstring: string = 'Group and aggregate';

  constructor(private pipelineEventsSvc: PipelineEventsService, private transformationSvc: TransformationService) { }

  ngOnInit() {

    this.currentlySelectedFunctionSubscription = this.pipelineEventsSvc.currentlySelectedFunction.subscribe((selFunction) => {
      this.currentlySelectedFunction = selFunction.currentFunction;
    });

    this.pipelineEventsSubscription = this.pipelineEventsSvc.currentPipelineEvent.subscribe((currentEvent) => {
      this.pipelineEvent = currentEvent;
      // In case we clicked edit
      if (currentEvent.startEdit && this.currentlySelectedFunction.__type === 'GroupRowsFunction') {
        this.modalEnabled = true;
        this.colnames = this.currentlySelectedFunction.colnames;
        this.colnamesFunctionsSet = this.currentlySelectedFunction.colnamesFunctionsSet;
        this.separatorSet = this.currentlySelectedFunction.separatorSet;
        this.docstring = this.currentlySelectedFunction.docstring;
      }
      // In case we clicked to add a new data cleaning step
      if (currentEvent.createNew && currentEvent.newStepType === 'GroupRowsFunction') {
        console.log("GroupRowsFunction")
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
    this.previewedDataSubscription.unsubscribe();
    this.pipelineEventsSubscription.unsubscribe();
    this.currentlySelectedFunctionSubscription.unsubscribe();
  }

  accept() {
    if (this.pipelineEvent.startEdit) {
      // change currentlySelectedFunction according to the user choices
      this.editGroupRowsFunction(this.currentlySelectedFunction);

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
      const newFunction = new transformationDataModel.GroupRowsFunction(this.colnames, this.colnamesFunctionsSet, this.separatorSet, this.docstring);

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

  private editGroupRowsFunction(instanceObj): any {
    instanceObj.colnames = this.colnames;
    instanceObj.colnamesFunctionsSet = this.colnamesFunctionsSet;
    instanceObj.separatorSet = this.separatorSet;
    instanceObj.docstring = this.docstring;
  }

  private resetModal() {
    // resets modal selection from selectbox
    this.pipelineEventsSvc.changePipelineEvent({
      cancel: true
    });
    this.modalEnabled = false;
    // resets the fields of the modal
    this.colnames = [];
    this.colnamesFunctionsSet = [null, null];
    this.separatorSet = [null];
    this.docstring = 'Group and aggregate';
  }

  cancel() {
    this.resetModal();
  }

  addAggregation() {
    this.colnamesFunctionsSet.push(null, null);
    this.separatorSet.push(null, null);
  }

  removeAggregation(idx: number) {
    this.colnamesFunctionsSet.splice(idx, 2);
    this.separatorSet.splice(idx, 2);
  }

  getSetLength() {
    var setLength = [];
    for (var i = 0; i < this.colnamesFunctionsSet.length; i += 2) {
      setLength.push(i);
    }
    return setLength;
  }

}
