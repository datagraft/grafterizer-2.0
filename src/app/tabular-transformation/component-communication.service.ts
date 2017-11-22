import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class ComponentCommunicationService {
  private subject = new Subject<any>();

  sendMessage(message: any) {
    this.subject.next(message);
    console.log(message);
  }

  clearMessage() {
    this.subject.next();
  }

  getMessage(): Observable<any> {
    return this.subject.asObservable();
  }
}
