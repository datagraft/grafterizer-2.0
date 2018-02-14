import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
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
      currentFunction: {},
      changedFunction: {}
    });
    this.currentlySelectedFunction = this.currentlySelectedFunctionSubj.asObservable();
    this.pipelineEventSubj = new BehaviorSubject<any>({
      startEdit: false,
      commitEdit: false,
      preview: false,
      delete: false
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
