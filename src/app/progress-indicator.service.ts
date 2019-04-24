import { Injectable } from '@angular/core';
import { Observable } from 'rxjs'
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class ProgressIndicatorService {

  private dataLoadingStatus: BehaviorSubject<boolean>;
  public currentDataLoadingStatus: Observable<any>;

  constructor() {
    this.dataLoadingStatus = new BehaviorSubject(false);
    this.currentDataLoadingStatus = this.dataLoadingStatus.asObservable();
  }

  // dataLoadingStatus is set to value 'true' when data loads and renders in table
  // dataLoadingStatus is set to value 'false' when data finished loading
  public changeDataLoadingStatus(message: boolean) {
    this.dataLoadingStatus.next(message);
  }

}
