import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import * as transformationDataModel from 'assets/transformationdatamodel.js';

@Injectable()
export class PipelineEventsService {

  private currentlySelectedFunctionSubj: BehaviorSubject<any>;
  public currentlySelectedFunction: Observable<any>;
  private pipelineEventSubj: BehaviorSubject<any>;
  public currentPipelineEvent: Observable<any>;

  constructor() {
    // TODO make interfaces for the currently selected function subject
    this.currentlySelectedFunctionSubj = new BehaviorSubject<any>({
      currentFunction: {}, // currently selected function in the pipeline
      changedFunction: {} // changed or added function
    });
    this.currentlySelectedFunction = this.currentlySelectedFunctionSubj.asObservable();
    this.pipelineEventSubj = new BehaviorSubject<any>({
      startEdit: false, // true when we click on the 'Edit' icon of a function
      commitEdit: false, // true when we click 'OK' after editing a function
      preview: false, // true when we are previewing a step in the pipeline
      delete: false, // true when we are deleting a step in the pipeline
      cancel: false, // true when we are cancelling a step in the pipeline      
      createNew: false, // true when we are adding a new step to the pipeline
      newStepType: "", // type of the new step to be added to the pipeline
      defaultParams: {}, // default parameters for a new step (could be given by recommender)
      commitCreateNew: false // true when we click OK after creating a new function
    });
    this.currentPipelineEvent = this.pipelineEventSubj.asObservable();
  }

  public changeSelectedFunction(selectedFunction: any) {
    this.currentlySelectedFunctionSubj.next(selectedFunction);
  }

  public changePipelineEvent(event: any) {
    this.pipelineEventSubj.next(event);
  }
}
