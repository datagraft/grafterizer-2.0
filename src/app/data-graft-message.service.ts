import { Injectable } from '@angular/core';
import { DispatchService } from './dispatch.service';
import { Router } from '@angular/router';

@Injectable()
export class DataGraftMessageService {

  // Path for the back button
  private pathBack: string;

  private channel: string;
  private connected: boolean;


  constructor(public dispatch: DispatchService, private router: Router) {
    this.channel = 'datagraft-post-message'
    this.connected = false;
    this.init();
  }

  init() {
    window.addEventListener('message', this.receiveMessage.bind(this), false);
    window.parent.postMessage({
      channel: this.channel,
      message: 'ready'
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

      switch (data.message) {
        case 'state.go':
          console.log('STATE GOGOGO');
          console.log(data.toParams);
          switch (data.state) {
            case 'transformations.new.preview':
              // this.router.navigate(['nvnikolov/transformations/eubg-sdati-uk/sample_uk_sdati_1000-csv/rdf-mapping']);
              break;
            case 'transformations.transformation.preview':
              // const url = data.toParams.publisher + '/transformations/' + data.toParams.id + '/' + data.toParams.distributionId + '/tabular-transformation';
              // this.router.navigate([url]);
              break;

            default:
              break;
          }
          // TODO change the state of the application here!
          // $state.go(data.state, data.toParams);
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
