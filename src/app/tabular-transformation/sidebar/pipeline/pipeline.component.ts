import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { TransformationService } from '../../../transformation.service';
import { PipelineEventsService } from '../../pipeline-events.service';
import { DispatchService } from '../../../dispatch.service';
import { Subscription } from 'rxjs';
import * as transformationDataModel from 'assets/transformationdatamodel.js';
import { MatVerticalStepper } from '@angular/material/stepper';
import { ActivatedRoute } from '@angular/router';
import { DataGraftMessageService } from '../../../data-graft-message.service';


@Component({
  moduleId: module.id,
  selector: 'pipeline',
  templateUrl: './pipeline.component.html',
  styleUrls: ['./pipeline.component.css'],
  providers: []
})

export class PipelineComponent implements OnInit, OnDestroy {

  @ViewChild('pipelineElement') pipelineElement: MatVerticalStepper;

  private transformationObj: any;
  steps: Array<any>;
  disableButton: boolean = false;
  private currentFunctionIndex: number;

  // contains the current pipeline event (edit, delete, preview)
  private pipelineEvent: any;

  // we keep the info on which function was selected previously and which is currently selected
  private currentlySelectedFunction: any;

  // we keep subscription objects so we can unsubscribe after destroying the component
  private transformationSubscription: Subscription;
  private pipelineEventsSubscription: Subscription;
  private currentlySelectedFunctionSubscription: Subscription;

  private currentDataGraftStateSubscription: Subscription;
  private currentDataGraftState: string;

  private previewedTransformationObj: any;

  private deleteFunctionEvent: any;
  deleteConfirmationModal = false;

  constructor(private route: ActivatedRoute, private transformationService: TransformationService, private pipelineEventsSvc: PipelineEventsService, public dispatch: DispatchService, private messageSvc: DataGraftMessageService) {
    this.steps = [];
  }

  ngOnInit() {
    this.transformationSubscription = this.transformationService.transformationObjSource.subscribe((transformation) => {
      if (transformation.pipelines.length) {
        // ;-(
        // TODO - not sure how to avoid having both the transformation and the steps
        this.transformationObj = transformation;
        this.steps = transformation.pipelines[0].functions;
      }
    });

    this.currentlySelectedFunctionSubscription = this.pipelineEventsSvc.currentlySelectedFunction.subscribe((selFunction) => {
      this.currentlySelectedFunction = selFunction;
    });

    this.pipelineEventsSubscription = this.pipelineEventsSvc.currentPipelineEvent.subscribe((currentEvent) => {
      this.pipelineEvent = currentEvent;
    });

    this.currentDataGraftStateSubscription = this.messageSvc.currentDataGraftStateSrc.subscribe((state) => {
      if (state.mode) {
        this.currentDataGraftState = state.mode;
        switch (this.currentDataGraftState) {
          case 'transformations.readonly':
            this.disableButton = true;
            break;
          case 'transformations.transformation':
          case 'transformations.transformation.preview':
          case 'transformations.transformation.preview.wizard':
          case 'transformations.new':
          case 'transformations.new.preview':
          case 'transformations.new.preview.wizard':
            this.disableButton = false;
            break;
        }
      }
    });
  }

  ngOnDestroy() {
    this.transformationSubscription.unsubscribe();
    this.currentlySelectedFunctionSubscription.unsubscribe();
    this.pipelineEventsSubscription.unsubscribe();
  }

  selectFunction(event) {
    const index = event.selectedIndex;

    // establish the function being changed
    this.currentFunctionIndex = parseInt(index, 10);
    if (this.currentFunctionIndex === undefined) {
      console.log('ERROR: Something bad and unexpected has happened!');
      return;
    }
    this.pipelineEventsSvc.changeSelectedFunction({
      currentFunction: this.steps[this.currentFunctionIndex],
      changedFunction: {}
    });
  }

  verboseLabels(pipelineFunc) {
    switch (pipelineFunc.__type) {
      case 'MakeDatasetFunction':
        return 'Headers created';
      case 'GroupRowsFunction':
        return 'Grouped and aggregated';
      case 'MeltFunction':
        return 'Dataset reshaped';
      case 'SortDatasetFunction':
        return 'Columns sorted';
      case 'DeriveColumnFunction':
        return 'Column derived';
      case 'MapcFunction':
        return 'Columns mapped';
      case 'AddColumnsFunction':
        return 'Column added';
      case 'ColumnsFunction':
        return 'Columns deleted';
      case 'ShiftColumnFunction':
        return 'Column shifted';
      case 'MergeColumnsFunction':
        return 'Columns merged';
      case 'SplitFunction':
        return 'Column split';
      case 'RenameColumnsFunction':
        return 'Header title(s) changed';
      case 'AddRowFunction':
        return 'Row(s) added';
      case 'ShiftRowFunction':
        return 'Row shifted';
      case 'DropRowsFunction':
        return 'Rows deleted';
      case 'GrepFunction':
        return 'Row(s) filtered';
      case 'RemoveDuplicatesFunction':
        return 'Duplicates removed';
      case 'UtilityFunction':
        return 'Utility';
      case 'ReconciliationFunction':
        return 'Reconcile data';
      case 'ExtensionFunction':
        return 'Extend data';
      default:
        return pipelineFunc.__type;
    }
  }

  triggerPipelineEvent(event) {
    const eventType = event.currentTarget.value;
    const index = parseInt(event.currentTarget.id, 10);

    if (index === undefined) {
      console.log('Error: something bad happened!');
      return;
    }

    const currentFunction = this.steps[index];

    // process the event
    switch (eventType) {
      case 'preview':
        currentFunction.isPreviewed = !currentFunction.isPreviewed;
        // toggle preview and reset all other events
        this.pipelineEvent.preview = currentFunction.isPreviewed;
        this.pipelineEvent.startEdit = false;
        this.pipelineEvent.commitEdit = false;
        this.pipelineEvent.delete = false;

        // change the previewed transformation if we toggled preview on
        if (this.pipelineEvent.preview === true) {
          this.transformationService.previewedTransformationObjSource.next(
            this.transformationObj.getPartialTransformation(currentFunction)
          );
          // reset isPreviewed for other functions
          this.steps.forEach((step, ind) => {
            if (step !== currentFunction) {
              step.isPreviewed = false;
            }
          });
        } else {
          // reset preview if we clicked preview of the already previewed element
          this.transformationService.previewedTransformationObjSource.next(this.transformationObj);
        }

        this.pipelineEventsSvc.changePipelineEvent(this.pipelineEvent);
        break;
      case 'edit':
        // if pipeline steps have not been clicked/ activated yet by user, set currentFunction to first function in pipeline
        if (!this.currentFunctionIndex) {
          this.pipelineEventsSvc.changeSelectedFunction({
            currentFunction: this.steps[0],
            changedFunction: {}
          });
        }
        // edit event triggered; keep preview until this step
        this.pipelineEvent.startEdit = true;
        this.pipelineEvent.commitEdit = false;
        this.pipelineEvent.delete = false;
        //        this.pipelineElement.selectedIndex++;
        this.pipelineEventsSvc.changePipelineEvent(this.pipelineEvent);
        break;
      case 'remove':
        // remove event triggered; all other events get reset
        this.pipelineEvent.delete = true;
        this.pipelineEvent.preview = false;
        this.pipelineEvent.startEdit = false;
        this.pipelineEvent.commitEdit = false;


        if (currentFunction instanceof transformationDataModel.ReconciliationFunction) {
          // if the function is a reconciliation function, remove the corresponding annotation
          this.transformationObj.removeAnnotationById(currentFunction.annotationId);
        } else if (currentFunction instanceof transformationDataModel.ExtensionFunction) {
          this.transformationObj.removeExtensionById(currentFunction.extensionId);
        }
        this.transformationObj.pipelines[0].remove(currentFunction);
        this.transformationService.previewedTransformationObjSource.next(this.transformationObj);
        this.transformationService.transformationObjSource.next(this.transformationObj);
        this.pipelineElement.selectedIndex = this.transformationObj.pipelines[0].functions.length - 1;
        this.pipelineElement._stateChanged();
        this.pipelineEventsSvc.changePipelineEvent(this.pipelineEvent);
        break;
    }
  }

  getIndexOfPreviewedFunction(): number {
    for (let i = 0; i < this.steps.length; ++i) {
      if (this.steps[i].isPreviewed) {
        return i;
      }
    }
    return -1;
  }

  openDeleteConfirmationModal(event) {
    const eventType = event.currentTarget.value;
    const index = parseInt(event.currentTarget.id, 10);
    // copy the relevant info from the event for later use if user confirms dialog
    this.deleteFunctionEvent = {
      currentTarget: {
        value: event.currentTarget.value,
        id: event.currentTarget.id
      }
    };
    this.deleteConfirmationModal = true;
  }

  confirmDelete() {
    this.triggerPipelineEvent(this.deleteFunctionEvent);
  }

  cancelDelete() {
    this.deleteConfirmationModal = false;
  }

}
