import { Injectable } from '@angular/core';
import { DispatchService } from './dispatch.service';
import { Router, NavigationEnd } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { RoutingService } from './routing.service';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class DataGraftMessageService {

  // Path for the back button
  private pathBack: string;
  private channel: string;
  private connected: boolean;
  private dataGraftMessage = new Subject<any>();
  // private currentDataGraftState: string = 'unknown';
  // private currentParams: any;
  private waitingForState: boolean;
  private grafterizerUrl: string;

  private currentDataGraftStateSrc: BehaviorSubject<any>;
  public currentDataGraftState: Observable<any>;

  private currentParamsSrc: BehaviorSubject<any>;
  public currentParams: Observable<any>;


  constructor(public dispatch: DispatchService, private router: Router, private routingService: RoutingService) {
    this.channel = 'datagraft-post-message'
    this.connected = false;
    this.routingService.getMessage().subscribe((url) => this.grafterizerUrl = url);

    this.currentDataGraftStateSrc = new BehaviorSubject<any>('unknown');
    this.currentParamsSrc = new BehaviorSubject<any>({});

    this.currentDataGraftState = this.currentDataGraftStateSrc.asObservable();
    this.currentParams = this.currentParamsSrc.asObservable();
    this.init();
  }

  public changeCurrentState(message: any) {
    this.currentDataGraftStateSrc.next(message);
  }

  public changeCurrentParams(message: any) {
    this.currentParamsSrc.next(message);
  }

  init() {
    window.addEventListener('message', this.receiveMessage.bind(this), false);
    window.parent.postMessage({
      channel: this.channel,
      message: 'ready'
    }, '*');
  }

  public changeDataGraftMessage(message: any) {
    this.dataGraftMessage.next(message);
  }

  public getDataGraftMessage(): Observable<any> {
    return this.dataGraftMessage.asObservable();
  }
  private wait(ms) {
    var start = Date.now(),
      now = start;
    while (now - start < ms) {
      now = Date.now();
    }
  };

  public getCurrentDataGraftMessageState(debug?: boolean): void {
    window.parent.postMessage({
      channel: this.channel,
      message: 'get-state-and-params'
    }, '*');
  }

  public getPathBack(): string {
    return this.pathBack;
  }

  /**
   * Checks if UI is embedded (e.g., as an IFrame in DataGraft)
   * @returns boolean true if the UI is embedded
   */
  public isEmbeddedMode(): boolean {
    return !(window === window.top);
  }

  public receiveMessage(event) {
    const data = event.data;
    if (!data || !data.channel || data.channel !== this.channel) {
      return;
    }
    this.connected = true;
    try {
      if (data.toParams) {
        if (data.toParams.path_back) {
          this.pathBack = data.toParams.path_back;
        }
      }
      if (data.state) {
        this.changeCurrentState(data.state);
      }
      if (data.toParams) {
        this.changeCurrentParams(data.toParams);
      }
      switch (data.message) {
        case 'state.go':
          switch (data.state) {
            case 'transformations.readonly':
              console.log('transformations.readonly');
              this.router.navigate([data.toParams.publisher, 'transformations', data.toParams.id, 'tabular-transformation']);
              break;
            case 'transformations.new':
              console.log('transformations.new');
              if (this.grafterizerUrl == undefined) {
                console.log('re-routing-from-datagraft-message-service');
                this.router.navigate(['transformations', 'new', 'tabular-transformation']);
              }
              break;
            case 'transformations.transformation':
              console.log('transformations.transformation');
              this.router.navigate([data.toParams.publisher, 'transformations', data.toParams.id, 'tabular-transformation']);
              break;
            default:
              break;
          }
          break;
        case 'upload-and-new':
          const file = new File([data.distribution], data.name, { type: data.type });
          // TODO THIS SUBSCRIPTION IS NEVER CLOSED
          this.dispatch.uploadFile(file)
            .subscribe(
              (result) => {
                // TODO what do we do when we receive the file?
              },
              (error) => {
                // TODO how do we handle errors?
                console.log('Error saving file!');
                console.log(error);
              });
          break;
      }
    } catch (e) {
      console.log(e);
    }
  }

  public isConnected() {
    return this.connected;
  };

  public setLocation(location: string) {
    window.parent.postMessage({
      channel: this.channel,
      message: 'set-location',
      location: location
    }, '*');
  };

}
