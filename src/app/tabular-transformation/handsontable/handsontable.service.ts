import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class HandsontableService {
  private subject = new Subject<any>();

  sendData(data: any) {
    this.subject.next(data);
  }

  getData(): Observable<any> {
    return this.subject.asObservable();
  }
}