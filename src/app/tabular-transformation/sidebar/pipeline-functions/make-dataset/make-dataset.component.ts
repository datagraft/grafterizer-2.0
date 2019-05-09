import { Component, OnInit } from '@angular/core';
import { MatChipInputEvent } from '@angular/material';
import { ENTER, COMMA } from '@angular/cdk/keycodes';

import * as transformationDataModel from '../../../../../assets/transformationdatamodel.js';
import { Subscription } from 'rxjs';
import { PipelineEventsService } from 'app/tabular-transformation/pipeline-events.service';
import { TransformationService } from 'app/transformation.service';

@Component({
  selector: 'make-dataset',
  templateUrl: './make-dataset.component.html',
  styleUrls: ['./make-dataset.component.css'],
  providers: []
})

export class MakeDatasetComponent implements OnInit {

  private selectable: boolean = true;
  private removable: boolean = true;
  private addOnBlur: boolean = true;
  private separatorKeysCodes = [ENTER, COMMA];

  modalEnabled = false;

  private currentlySelectedFunctionSubscription: Subscription;
  private currentlySelectedFunction: any;

  private pipelineEventsSubscription: Subscription;
  private pipelineEvent: any = { startEdit: false };

  makedatasetmode: String = 'colnames';
  private columnsArray: Array<any> = [];
  private useLazy = false;
  private moveFirstRowToHeader: boolean;
  private numberOfColumns: Number = undefined;
  docstring: String = 'Create headers';

  constructor(private pipelineEventsSvc: PipelineEventsService, private transformationSvc: TransformationService) { }

  ngOnInit() {

    this.currentlySelectedFunctionSubscription = this.pipelineEventsSvc.currentlySelectedFunction.subscribe((selFunction) => {
      this.currentlySelectedFunction = selFunction.currentFunction;
    });

    this.pipelineEventsSubscription = this.pipelineEventsSvc.currentPipelineEvent.subscribe((currentEvent) => {
      this.pipelineEvent = currentEvent;

      // In case we clicked edit
      if (currentEvent.startEdit && this.currentlySelectedFunction.__type === 'MakeDatasetFunction') {
        this.modalEnabled = true;
        this.useLazy = this.currentlySelectedFunction.useLazy;
        this.docstring = this.currentlySelectedFunction.docstring;
        // determine the mode
        if (this.currentlySelectedFunction.moveFirstRowToHeader) {
          this.makedatasetmode = 'firstrow';
        } else if (this.currentlySelectedFunction.numberOfColumns !== undefined) {
          this.numberOfColumns = this.currentlySelectedFunction.numberOfColumns;
          this.makedatasetmode = 'ncolumns';
        } else {
          this.makedatasetmode = 'colnames';
          this.columnsArray = this.currentlySelectedFunction.columnsArray.map((o) => {
            return { display: o.value, value: o.value }
          });
        }
      }
      // In case we clicked to add a new data cleaning step
      if (currentEvent.createNew && currentEvent.newStepType === 'MakeDatasetFunction') {
        this.modalEnabled = true;
      }
    });
  }

  add(event: MatChipInputEvent): void {
    let input = event.input;
    let value = event.value;
    // Add header
    if ((value || '').trim()) {
      this.columnsArray.push({ display: value, value: value.trim() });
    }
    // Reset the input value
    if (input) {
      input.value = '';
    }
  }

  remove(header: any): void {
    let index = this.columnsArray.indexOf(header);
    if (index >= 0) {
      this.columnsArray.splice(index, 1);
    }
  }

  accept() {
    if (this.pipelineEvent.startEdit) {
      // change currentlySelectedFunction according to the user choices
      this.createMakeDatasetFunction(this.currentlySelectedFunction);

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
    } else if (this.pipelineEvent.createNew) {
      // create empty object
      const newFunction = new transformationDataModel.MakeDatasetFunction(null, null, null, null, null);

      // apply user choices to the empty object
      this.createMakeDatasetFunction(newFunction);

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

  // Creates a make-dataset function in instanceObj (must be of type transformationDataModel.MakeDatasetFunction)
  // based on the selected options in the modal
  private createMakeDatasetFunction(instanceObj): any {
    switch (this.makedatasetmode) {
      case 'colnames': {
        instanceObj.columnsArray = [];
        let index = 0;
        for (const col of this.columnsArray) {
          instanceObj.columnsArray.push({ id: index, value: col.value });
          index++;
        }
        instanceObj.useLazy = false;
        instanceObj.numberOfColumns = undefined;
        instanceObj.moveFirstRowToHeader = false;
        instanceObj.docstring = this.docstring;
        break;
      }
      case 'ncolumns': {
        instanceObj.columnsArray = this.columnsArray;
        instanceObj.useLazy = true;
        instanceObj.numberOfColumns = this.numberOfColumns;
        instanceObj.moveFirstRowToHeader = false;
        instanceObj.docstring = this.docstring;
        break;
      }
      case 'firstrow': {
        instanceObj.columnsArray = [];
        instanceObj.useLazy = false;
        instanceObj.numberOfColumns = this.numberOfColumns;
        instanceObj.moveFirstRowToHeader = true;
        instanceObj.docstring = this.docstring;
        break;
      }
    }
    instanceObj.isPreviewed = true;
  }

  private resetModal() {
    // resets modal selection from selectbox
    this.pipelineEventsSvc.changePipelineEvent({
      cancel: true
    });
    this.modalEnabled = false;
    // resets the fields of the modal        
    this.makedatasetmode = 'colnames';
    this.columnsArray = [];
    this.useLazy = false;
    this.moveFirstRowToHeader = false;
    this.numberOfColumns = undefined;
    this.docstring = 'Create headers';
  }

  cancel() {
    this.resetModal();
  }

}
