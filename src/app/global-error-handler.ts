import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';


@Injectable()
export class GlobalErrorHandler implements ErrorHandler {

  private globalErrorSubject: BehaviorSubject<Array<any>>;
  public globalErrorObs: Observable<any>;

  constructor(private injector: Injector) {
    this.globalErrorSubject = new BehaviorSubject<Array<any>>([]);
    this.globalErrorObs = this.globalErrorSubject.asObservable();
  }


  handleError(error) {
    const message = error.message ? error.message : error.toString();
    console.log('error!');
    console.log(message);
    // log on the server
//    throw error;
  }
}
