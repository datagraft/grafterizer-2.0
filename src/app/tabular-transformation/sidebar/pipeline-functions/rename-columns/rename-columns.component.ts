import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import * as transformationDataModel from '../../../../../assets/transformationdatamodel.js';
import { PipelineEventsService } from 'app/tabular-transformation/pipeline-events.service';
import { TransformationService } from 'app/transformation.service';

@Component({
  selector: 'rename-columns',
  templateUrl: './rename-columns.component.html',
  styleUrls: ['./rename-columns.component.css']
})

export class RenameColumnsComponent implements OnInit {

  modalEnabled: boolean = false;
  private currentlySelectedFunctionSubscription: Subscription;
  private currentlySelectedFunction: any;
  private pipelineEventsSubscription: Subscription;
  private pipelineEvent: any = { startEdit: false };
  private previewedDataSubscription: Subscription;
  private previewedTransformationSubscription: Subscription;
  private previewedDataColumns: any[] = [];
  private functionsToRenameWith = [null];
  private mappings: any = [null, null];
  private renamecolumnsmode: string = 'mapping';
  docstring: string = 'Rename columns';

  constructor(private pipelineEventsSvc: PipelineEventsService, private transformationSvc: TransformationService) { }

  ngOnInit() {

    this.currentlySelectedFunctionSubscription = this.pipelineEventsSvc.currentlySelectedFunction.subscribe((selFunction) => {
      this.currentlySelectedFunction = selFunction.currentFunction;
    });

    this.pipelineEventsSubscription = this.pipelineEventsSvc.currentPipelineEvent.subscribe((currentEvent) => {
      this.pipelineEvent = currentEvent;
      // In case we clicked edit
      if (currentEvent.startEdit && this.currentlySelectedFunction.__type === 'RenameColumnsFunction') {
        this.modalEnabled = true;
        this.mappings = this.currentlySelectedFunction.mappings;
        this.docstring = this.currentlySelectedFunction.docstring;
      }
      // In case we clicked to add a new data cleaning step
      if (currentEvent.createNew && currentEvent.newStepType === 'RenameColumnsFunction') {
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
    this.previewedDataSubscription.unsubscribe();
    this.pipelineEventsSubscription.unsubscribe();
    this.currentlySelectedFunctionSubscription.unsubscribe();
  }

  accept() {
    if (this.pipelineEvent.startEdit) {
      // change currentlySelectedFunction according to the user choices
      this.editRenameColumnsFunction(this.currentlySelectedFunction);

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
      const newFunction = new transformationDataModel.RenameColumnsFunction(this.functionsToRenameWith, this.mappings, this.docstring);

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

  private editRenameColumnsFunction(instanceObj): any {
    let map = [];
    if (this.mappings[0] && !this.mappings[0].hasOwnProperty('id')) {
      for (var i = 0; i < this.mappings.length; ++i) {
        map.push((i % 2) ? this.mappings[i] : {
          id: i / 2,
          value: this.mappings[i]
        });
      }
      instanceObj.mappings = map;
    }
    instanceObj.functionsToRenameWith = this.functionsToRenameWith;
    instanceObj.docstring = this.docstring;
    console.log(instanceObj);
  }

  resetModal() {
    // resets modal selection from selectbox
    this.pipelineEventsSvc.changePipelineEvent({
      cancel: true
    });
    // resets the fields of the modal
    this.modalEnabled = false;
    this.mappings = [null, null]
    this.renamecolumnsmode = 'mapping';
    this.docstring = 'Rename columns';
  }

  addMapping() {
    this.mappings.push(null, null);
  }

  removeMapping(idx) {
    this.mappings.splice(idx, 2);
  }

  getmaplength() {
    var b = [];
    for (var i = 0; i < this.mappings.length; i += 2) b.push(i);
    return b;
  }

}
