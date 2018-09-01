import { Injectable } from '@angular/core';
import { DispatchService } from './dispatch.service';
import { Router, NavigationEnd } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { RoutingService } from './routing.service';

@Injectable()
export class DataGraftMessageService {

  // Path for the back button
  private pathBack: string;
  private channel: string;
  private connected: boolean;
  private dataGraftMessage = new Subject<any>();
  private currentDataGraftState: string;
  private grafterizerUrl: string;

  constructor(public dispatch: DispatchService, private router: Router, private routingService: RoutingService) {
    this.channel = 'datagraft-post-message'
    this.connected = false;
    this.routingService.getMessage().subscribe((url) => this.grafterizerUrl = url);
    this.init();
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

  public getCurrentDataGraftState(): string {
    return this.currentDataGraftState;
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

      switch (data.message) {
        case 'state.go':
          console.log('state.go');
          this.changeDataGraftMessage(data);
          this.currentDataGraftState = data.state;
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
