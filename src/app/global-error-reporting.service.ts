import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class GlobalErrorReportingService {

  private globalErrorSubject: BehaviorSubject<Array<any>>;
  public globalErrorObs: Observable<any>;

  constructor() {
    this.globalErrorSubject = new BehaviorSubject<Array<any>>([]);
    this.globalErrorObs = this.globalErrorSubject.asObservable();
  }

  public changeGlobalErrors(errors: Array<any>) {
    this.globalErrorSubject.next(errors);
  }
}
