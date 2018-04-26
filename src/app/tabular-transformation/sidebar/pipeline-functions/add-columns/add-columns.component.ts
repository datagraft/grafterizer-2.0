import { Component, OnInit } from '@angular/core';

import * as transformationDataModel from '../../../../../assets/transformationdatamodel.js';
import { Subscription } from 'rxjs/Subscription';
import { PipelineEventsService } from 'app/tabular-transformation/pipeline-events.service';
import { TransformationService } from 'app/transformation.service';

@Component({
  selector: 'add-columns',
  templateUrl: './add-columns.component.html',
  styleUrls: ['./add-columns.component.css']
})

export class AddColumnsComponent implements OnInit {

  private modalEnabled: boolean;

  private currentlySelectedFunctionSubscription: Subscription;
  private currentlySelectedFunction: any;

  private pipelineEventsSubscription: Subscription;
  private pipelineEvent: any;

  private previewedDataSubscription: Subscription;
  private previewedDataColumns: any;

  private colname: string;
  private columnsArray: any = [];
  private docstring: string;

  constructor(private pipelineEventsSvc: PipelineEventsService, private transformationSvc: TransformationService) { }

  ngOnInit() {

    this.modalEnabled = false;
    this.docstring = 'Add columns';

    this.currentlySelectedFunctionSubscription = this.pipelineEventsSvc.currentlySelectedFunction.subscribe((selFunction) => {
      this.currentlySelectedFunction = selFunction.currentFunction;
    });

    this.pipelineEventsSubscription = this.pipelineEventsSvc.currentPipelineEvent.subscribe((currentEvent) => {
      this.pipelineEvent = currentEvent;
      // In case we clicked edit      
      if (currentEvent.startEdit && this.currentlySelectedFunction.__type === 'AddColumnsFunction') {
        this.modalEnabled = true;
        this.columnsArray = this.currentlySelectedFunction.columnsArray;
        this.docstring = this.currentlySelectedFunction.docstring;
      }
      // In case we clicked to add a new data cleaning step
      if (currentEvent.createNew && currentEvent.newStepType === 'AddColumnsFunction') {
        this.modalEnabled = true;
        var newColSpec = new transformationDataModel.NewColumnSpec(null, null, null, null);
        this.columnsArray.push(newColSpec);
      }
    });

    this.previewedDataSubscription = this.transformationSvc.currentGraftwerkData
      .subscribe((previewedData) => {
        if (previewedData[':column-names']) {
          this.previewedDataColumns = previewedData[':column-names'].map(o => o.substring(1, o.length));
        }
      });
  }

  private addColumn() {
    var newColSpec = new transformationDataModel.NewColumnSpec(null, null, null, null);
    this.columnsArray.push(newColSpec);
  }

  private removeColumn(id: number) {
    this.columnsArray.splice(id, 1);
  }

  private accept() {
    if (this.pipelineEvent.startEdit) {
      // change currentlySelectedFunction according to the user choices
      this.createAddColumnsFunction(this.currentlySelectedFunction);

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
      const newFunction = new transformationDataModel.AddColumnsFunction(this.columnsArray, this.docstring);

      // apply user choices to the empty object
      this.createAddColumnsFunction(newFunction);

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

  private createAddColumnsFunction(instanceObj): any {
    instanceObj.columnsArray = this.columnsArray;
    instanceObj.docstring = this.docstring;
    instanceObj.isPreviewed = true;
  }

  private resetModal() {
    // resets modal selection from selectbox
    this.pipelineEventsSvc.changePipelineEvent({
      cancel: true
    });
    this.modalEnabled = false;
    // resets the fields of the modal
    this.columnsArray = [];
    this.docstring = 'Add columns';
  }

  private cancel() {
    this.resetModal();
  }

}