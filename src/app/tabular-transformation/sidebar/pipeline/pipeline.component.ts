import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { TransformationService } from '../../../transformation.service';
import { PipelineEventsService } from '../../pipeline-events.service';
import { Subscription } from 'rxjs/Subscription';
import * as transformationDataModel from 'assets/transformationdatamodel.js';
import { MatVerticalStepper } from '@angular/material/stepper';


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
  private steps: Array<any>;
  private showPipeline: boolean;

  // contains the current pipeline event (edit, delete, preview)
  private pipelineEvent: any;

  // we keep the info on which function was selected previously and which is currently selected
  private currentlySelectedFunction: any;

  // we keep subscription objects so we can unsubscribe after destroying the component
  private transformationSubscription: Subscription;
  private previewedTransformationSubscription: Subscription;
  private pipelineEventsSubscription: Subscription;
  private currentlySelectedFunctionSubscription: Subscription;

  private previewedTransformationObj: any;

  private deleteFunctionEvent: any;
  private deleteConfirmationModal = false;

  constructor(private transformationService: TransformationService, private pipelineEventsSvc: PipelineEventsService) {
    this.steps = [];
    this.showPipeline = true; // TODO: not sure why we need this
  }

  private getIndexOfPreviewedFunction(): number {
    for (let i = 0; i < this.steps.length; ++i) {
      if (this.steps[i].isPreviewed) {
        return i;
      }
    }
    return -1;
  }

  ngOnInit() {
    this.transformationSubscription = this.transformationService.currentTransformationObj.subscribe((transformation) => {
      if (transformation.pipelines.length) {
        // ;-(
        // TODO - not sure how to avoid having both the transformation and the steps
        this.transformationObj = transformation;
        this.steps = transformation.pipelines[0].functions;
      }
    });

//    this.previewedTransformationSubscription = this.transformationService.currentPreviewedTransformationObj.subscribe(
//      (previewedTransformation) => {
//        this.previewedTransformationObj = previewedTransformation;
//        console.log(this.previewedTransformationObj);
//        // null safety first (currentlySelectedFunction.currentFunction may be empty on initialisation)
//        if (this.previewedTransformationObj.pipelines.length) {
//          console.log(this.pipelineEvent);
//          const previewedIndex = this.getIndexOfPreviewedFunction();
//          if (previewedIndex >= 0) {
//            this.pipelineElement.selectedIndex = previewedIndex;
//          } else if (this.steps.length) {
//            if (this.pipelineElement.selected) {
//              this.pipelineElement.selectedIndex = this.steps.length - 1;
//            }
//
//            this.steps[this.steps.length - 1].isPreviewed = true;
//          }
//        }
//      });

    this.currentlySelectedFunctionSubscription = this.pipelineEventsSvc.currentlySelectedFunction.subscribe((selFunction) => {
      this.currentlySelectedFunction = selFunction;
    });

    this.pipelineEventsSubscription = this.pipelineEventsSvc.currentPipelineEvent.subscribe((currentEvent) => {
      this.pipelineEvent = currentEvent;
    });

  }

  ngOnDestroy() {
    this.transformationSubscription.unsubscribe();
//    this.previewedTransformationSubscription.unsubscribe();
    this.currentlySelectedFunctionSubscription.unsubscribe();
    this.pipelineEventsSubscription.unsubscribe();
  }

  selectFunction(event) {
    console.log('selection changed');
    const index = event.selectedIndex;

    // establish the function being changed
    const currentFunctionIndex = parseInt(index, 10);
    if (currentFunctionIndex === undefined) {
      console.log('ERROR: Something bad and unexpected has happened!');
      return;
    }
    this.pipelineEventsSvc.changeSelectedFunction({
      currentFunction: this.steps[currentFunctionIndex],
      changedFunction: {}
    });
  }

  verboseLabels(label) {
    switch (label) {
      case 'DropRowsFunction':
        return 'Rows deleted'
      case 'MakeDatasetFunction':
        return 'Headers created'
      case 'UtilityFunction':
        return 'Utility'
      case 'DropRowsFunction':
        return 'Rows deleted'
      case 'MapcFunction':
        return 'Columns mapped'
      case 'MeltFunction':
        return 'Dataset reshaped'
      case 'DeriveColumnFunction':
        return 'Column derived'
      case 'AddColumnsFunction':
        return 'Column(s) added'
      case 'AddRowFunction':
        return 'Row(s) added'
      case 'RenameColumnsFunction':
        return 'Header title(s) changed'
      case 'GrepFunction':
        return 'Row(s) filtered'
      default:
        return label;
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
          this.transformationService.changePreviewedTransformationObj(
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
          this.transformationService.changePreviewedTransformationObj(this.transformationObj);
        }

        this.pipelineEventsSvc.changePipelineEvent(this.pipelineEvent);
        break;
      case 'edit':
        // edit event triggered; keep preview until this step
        this.pipelineEvent.startEdit = true;
        this.pipelineEvent.commitEdit = false;
        this.pipelineEvent.delete = false;
        //        console.log(this.pipelineElement.selectedIndex);
        //        this.pipelineElement.selectedIndex++;
        this.pipelineEventsSvc.changePipelineEvent(this.pipelineEvent);
        break;
      case 'remove':
        // remove event triggered; all other events get reset
        this.pipelineEvent.delete = true;
        this.pipelineEvent.preview = false;
        this.pipelineEvent.startEdit = false;
        this.pipelineEvent.commitEdit = false;

        this.transformationObj.pipelines[0].remove(currentFunction);
        this.transformationService.changePreviewedTransformationObj(this.transformationObj);
        this.transformationService.changeTransformationObj(this.transformationObj);
        this.pipelineElement.selectedIndex = this.transformationObj.pipelines[0].functions.length - 1;
        this.pipelineElement._stateChanged();
        this.pipelineEventsSvc.changePipelineEvent(this.pipelineEvent);
        break;
    }
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
    console.log(this.deleteConfirmationModal);
  }

  cancelDelete() {
    this.deleteConfirmationModal = false;
    console.log(this.deleteConfirmationModal);
  }

}
