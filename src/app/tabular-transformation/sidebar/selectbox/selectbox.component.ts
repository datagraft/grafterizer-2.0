import { Component, OnInit, Output, Input, EventEmitter, OnDestroy, OnChanges } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { SelectItem } from 'primeng/primeng';
import {
  AddRowFunction, DropRowsFunction, ColumnsFunction, MakeDatasetFunction, MapcFunction,
  KeyFunctionPair, CustomFunctionDeclaration, AddColumnsFunction
} from '../../../../assets/transformationdatamodel.js';
import { TransformationService } from 'app/transformation.service';
import { PipelineEventsService } from 'app/tabular-transformation/pipeline-events.service';

@Component({
  moduleId: module.id,
  selector: 'selectbox',
  templateUrl: './selectbox.component.html',
  styleUrls: ['./selectbox.component.css'],
  providers: []
})

export class SelectboxComponent implements OnInit, OnDestroy, OnChanges {

  @Input() suggestions;
  @Input() headers;
  @Output() emitter = new EventEmitter();

  private transformations: SelectItem[];
  private selected: any;
  private modalEnabled = false;
  private message: any;

  private transformationSubscription: Subscription;
  private transformationObj: any;

  private selectedFunctionSubscription: Subscription;
  private selectedFunction: any;

  private pipelineEventsSubscription: Subscription;
  private pipelineEvent: any;

  constructor(private transformationSvc: TransformationService, private pipelineEventsSvc: PipelineEventsService) {
    this.transformations = [];
    this.selected = { id: null, defaultParams: null };
  }

  ngOnChanges() {
    if (this.suggestions) {
      this.transformations = this.suggestions;
    }
    this.selected = { id: null, defaultParams: null };
  }

  ngOnInit() {
    this.transformationSubscription = this.transformationSvc.currentTransformationObj.subscribe((transformation) => {
      this.transformationObj = transformation;
    });

    this.pipelineEventsSubscription = this.pipelineEventsSvc.currentPipelineEvent.subscribe((pipelineEvent) => {
      this.pipelineEvent = pipelineEvent;

      // in case we finished editing a step
      if (this.pipelineEvent.commitEdit) {
        this.transformationSvc.changePreviewedTransformationObj(
          this.transformationObj.getPartialTransformation(this.selectedFunction.changedFunction)
        );
        // reset isPreviewed for other functions
        this.transformationObj.pipelines[0].functions.forEach((step, ind) => {
          if (step !== this.selectedFunction.changedFunction) {
            step.isPreviewed = false;
          }
        });
      }

      // in case we finished creating a step
      if (this.pipelineEvent.commitCreateNew && this.selectedFunction.changedFunction.__type) {
        // add new step to the transformation object
        this.transformationObj.pipelines[0].addAfter(this.selectedFunction.currentFunction, this.selectedFunction.changedFunction);

        // notify of change to transformation object
        this.transformationSvc.changeTransformationObj(this.transformationObj);

        // change previewed transformation
        this.transformationSvc.changePreviewedTransformationObj(
          this.transformationObj.getPartialTransformation(this.selectedFunction.changedFunction)
        );

        // reset isPreviewed for other functions
        this.transformationObj.pipelines[0].functions.forEach((step, ind) => {
          if (step !== this.selectedFunction.changedFunction) {
            step.isPreviewed = false;
          }
        });
      }
    });

    this.selectedFunctionSubscription = this.pipelineEventsSvc.currentlySelectedFunction.subscribe((selectedFunction) => {
      this.selectedFunction = selectedFunction;
    });

  }

  ngOnDestroy() {
    this.pipelineEventsSubscription.unsubscribe();
    this.selectedFunctionSubscription.unsubscribe();
    this.transformationSubscription.unsubscribe();
  }

  emitFunction(value: any) {
    this.emitter.emit(value);
  }

  onChange($event) {
    this.pipelineEventsSvc.changePipelineEvent({
      startEdit: false,
      commitEdit: false,
      preview: false,
      delete: false,
      createNew: true,
      newStepType: this.selected.id // TODO NEED TO CHANGE THIS
    });
    // Functions that don't require additional user input
    /*     switch (this.selected.id) {
          case 'add-row-above':
          case 'add-row-below':
            this.emitFunction(new AddRowFunction(this.selected.defaultParams.position, this.selected.defaultParams.values, ''));
            break;
          case 'make-dataset-header':
            this.emitFunction(new MakeDatasetFunction(
              [], null, undefined, this.selected.defaultParams.moveFirstRowToHeader, null));
            break;
          case 'map-columns-uc':
            this.emitFunction(new MapcFunction(
              this.selected.defaultParams.keyFunctionPairs, null));
            break;
          case 'take-rows-delete':
            this.emitFunction(new DropRowsFunction(
              this.selected.defaultParams.indexFrom, this.selected.defaultParams.indexTo, this.selected.defaultParams.take, null));
            break;
          case 'take-columns-delete':
            this.emitFunction(new ColumnsFunction(
              [this.selected.defaultParams.colToDelete], null, null, false, null));
            break;
          default:
            break;
        } */
  }
}
