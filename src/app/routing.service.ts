import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Router, ActivatedRoute, ParamMap, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { Subject } from 'rxjs';

@Injectable()
export class RoutingService {

    private subject = new Subject<any>();
    private previousUrl: any = undefined;
    private currentUrl: any = undefined;

    constructor(private router: Router) {
        this.currentUrl = this.router.routerState.snapshot.url;
        router.events.subscribe(event => {
            if (event instanceof NavigationEnd) {
                this.previousUrl = this.currentUrl;
                this.currentUrl = event.url;
            };
        });
    }

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
    }

    getPreviousUrl() {
        return Promise.resolve(this.previousUrl);
    }

}