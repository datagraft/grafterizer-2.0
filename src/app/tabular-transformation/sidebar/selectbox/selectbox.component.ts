import { Component, OnInit, Output, Input, EventEmitter, OnDestroy, OnChanges } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { ActivatedRoute } from '@angular/router';
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
  private transformationOnlyView: boolean;

  private transformationSubscription: Subscription;
  private transformationObj: any;

  private selectedFunctionSubscription: Subscription;
  private selectedFunction: any;

  private pipelineEventsSubscription: Subscription;
  private pipelineEvent: any;

  constructor(private route: ActivatedRoute, private transformationSvc: TransformationService, private pipelineEventsSvc: PipelineEventsService) {
    this.transformations = [];
    this.selected = { id: null, defaultParams: null };
  }

  ngOnChanges() {
    if (this.suggestions) {
      this.transformations = this.suggestions;
    }
  }

  ngOnInit() {
    this.transformationOnlyView = false;
    const paramMap = this.route.snapshot.paramMap;
    if (!paramMap.has('filestoreId')) {
      this.transformationOnlyView = true;
    };

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

      // in case we cancel adding a new step/ editing an existing step
      if (this.pipelineEvent.cancel) {
        this.selected = { id: null, defaultParams: null };
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
