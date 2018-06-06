import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subscription } from 'rxjs/Subscription';
import { GlobalErrorReportingService } from 'app/global-error-reporting.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {


  private globalErrors: Array<any> = [];

  private globalErrorsSubscription: Subscription;

  constructor(private injector: Injector, private globalErrorRepSvc: GlobalErrorReportingService) {
    this.globalErrorRepSvc = new GlobalErrorReportingService();
    if (globalErrorRepSvc !== undefined) {
      console.log(globalErrorRepSvc);
    }
    this.globalErrorsSubscription = this.globalErrorRepSvc.globalErrorObs.subscribe((globalErrors) => {
      this.globalErrors = globalErrors;
    });
  }

  handleError(error) {
    if (error) {
      const message = error.message ? error.message : error.toString();
      console.log('error!');
      console.log(error);
      this.globalErrors.push(message);
      const tmpHack: any = this.injector;
      // I have no idea why this works...
      tmpHack.changeGlobalErrors(this.globalErrors);
    }
  }
}
