import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class GlobalErrorReportingService {

  private globalErrorSubject: BehaviorSubject<Array<any>>;
  public globalErrorObs: Observable<any>;

  private previewErrorSubject: BehaviorSubject<Array<any>>;
  public previewErrorObs: Observable<any>;

  constructor() {
    this.globalErrorSubject = new BehaviorSubject<Array<any>>([]);
    this.globalErrorObs = this.globalErrorSubject.asObservable();
    this.previewErrorSubject = new BehaviorSubject<Array<any>>(undefined);
    this.previewErrorObs = this.previewErrorSubject.asObservable();
  }

  public changeGlobalErrors(errors: Array<any>) {
    this.globalErrorSubject.next(errors);
  }

  public changePreviewError(error: any) {
    this.previewErrorSubject.next(error);
  }
}
