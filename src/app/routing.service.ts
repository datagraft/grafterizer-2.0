import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class RoutingService {
    private subject = new Subject<any>();

    sendMessage(message: any) {
        this.subject.next(message);
    }

    clearMessage() {
        this.subject.next();
    }

    getMessage(): Observable<any> {
        return this.subject.asObservable();
    }

    concatURL(route) {
        route.snapshot.url.pop();
        let str = '';
        for (let o in route.snapshot.url) {
            str = str.concat(route.snapshot.url[o].path);
            str = str.concat('/');
        }
        this.sendMessage(str);
        console.log(str);
    }
}