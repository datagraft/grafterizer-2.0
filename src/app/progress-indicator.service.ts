import { Injectable } from '@angular/core';
import { Observable } from 'rxjs'
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class ProgressIndicatorService {

  private dataLoadingStatus: BehaviorSubject<boolean>;
  private grafterizerLoadingStatus: BehaviorSubject<boolean>;
  public currentDataLoadingStatus: Observable<any>;
  public currentGrafterizerLoadingStatus: Observable<any>;

  constructor() {
    this.dataLoadingStatus = new BehaviorSubject(false);
    this.grafterizerLoadingStatus = new BehaviorSubject(false);
    this.currentDataLoadingStatus = this.dataLoadingStatus.asObservable();
    this.currentGrafterizerLoadingStatus = this.grafterizerLoadingStatus.asObservable();
  }

  // dataLoadingStatus is set to value 'true' when data loads and renders in table
  // dataLoadingStatus is set to value 'false' when data finished loading
  public changeDataLoadingStatus(message: boolean) {
    this.dataLoadingStatus.next(message);
  }

  /**
   * Puts Grafterizer UI in loading mode - e.g., for disabling the UI while loading the transformation to be edited.
   * @param  {boolean} newStatus - new status of the UI
   */
  public changeGrafterizerLoadingStatus(newStatus: boolean) {
    this.grafterizerLoadingStatus.next(newStatus);
  }

}
