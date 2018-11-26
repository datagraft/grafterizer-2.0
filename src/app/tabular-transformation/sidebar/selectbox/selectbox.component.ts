import { Component, OnInit, Output, Input, EventEmitter, OnDestroy, OnChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { SelectItem } from 'primeng/primeng';
import {
  AddRowFunction, DropRowsFunction, ColumnsFunction, MakeDatasetFunction, MapcFunction,
  KeyFunctionPair, CustomFunctionDeclaration, AddColumnsFunction
} from '../../../../assets/transformationdatamodel.js';
import { TransformationService } from 'app/transformation.service';
import { PipelineEventsService } from 'app/tabular-transformation/pipeline-events.service';
import { DataGraftMessageService } from '../../../data-graft-message.service';

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

  private recommendedFunctions: SelectItem[] = [];
  private allFunctions: SelectItem[] = [];

  private selected: any = { id: null, defaultParams: null };
  private modalEnabled = false;
  private message: any;
  private transformationReadOnlyView: boolean = false;

  private transformationMetadataSubscription: Subscription;
  private isOwned: boolean;

  private transformationSubscription: Subscription;
  private transformationObj: any;

  private selectedFunctionSubscription: Subscription;
  private selectedFunction: any;

  private pipelineEventsSubscription: Subscription;
  private pipelineEvent: any;

  private currentDataGraftStateSubscription: Subscription;
  private currentDataGraftState: string;


  constructor(private route: ActivatedRoute,
    private transformationSvc: TransformationService,
    private pipelineEventsSvc: PipelineEventsService,
    private messageSvc: DataGraftMessageService) {

  }

  ngOnChanges() {
    if (this.suggestions) {
      this.recommendedFunctions = this.suggestions;
    }
  }

  ngOnInit() {

    // this.currentDataGraftStateSubscription = this.messageSvc.currentDataGraftState.subscribe((state) => {
    //   if (state.mode) {
    //     this.currentDataGraftState = state.mode;
    //     if (this.currentDataGraftState == 'transformations.transformation'
    //       || this.currentDataGraftState == 'transformations.new'
    //       || this.currentDataGraftState == 'transformations.transformation.preview'
    //       || document.referrer.includes('/new/')
    //       || this.currentDataGraftState == 'standalone') {
    //       this.transformationReadOnlyView = false;
    //     } else {
    //       this.transformationReadOnlyView = true;
    //     }
    //   }
    // });

    this.transformationMetadataSubscription = this.transformationSvc.currentTransformationMetadata.subscribe((transformationMeta) => {
      if (transformationMeta.is_owned) {
        this.isOwned = true;
      }
    });

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
        console.log(this.transformationObj)
        console.log(this.selectedFunction.currentFunction)
        console.log(this.selectedFunction.changedFunction)

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

      // in case we cancel adding a new step/ editing an existing step
      if (this.pipelineEvent.cancel) {
        this.selected = { id: null, defaultParams: null };
      }

    });

    this.selectedFunctionSubscription = this.pipelineEventsSvc.currentlySelectedFunction.subscribe((selectedFunction) => {
      this.selectedFunction = selectedFunction;
    });

    this.allFunctions = this.recommendedFunctions;

  }

  ngOnDestroy() {
    this.pipelineEventsSubscription.unsubscribe();
    this.selectedFunctionSubscription.unsubscribe();
    this.transformationSubscription.unsubscribe();
  }

  showAllFunctions() {
    this.recommendedFunctions = this.allFunctions;
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
      cancel: false,
      createNew: true,
      newStepType: this.selected.id // TODO NEED TO CHANGE THIS
    });
  }

  openCustomFunctionModal() {
    this.selected.id = 'CustomFunctionDeclaration';
    this.onChange(null);
  }

}
