import { Injectable } from '@angular/core';
import { DispatchService } from './dispatch.service';

@Injectable()
export class DataGraftMessageService {

  private channel: string;
  private connected: boolean;

  constructor(public dispatch: DispatchService) {
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

  public receiveMessage(event) {
    const data = event.data;
    if (!data || !data.channel || data.channel !== this.channel) {
      return;
    }

    this.connected = true;

    try {
      switch (data.message) {
        case 'state.go':
          console.log('STATE GOGOGO');
          console.log(data.toParams);
          // TODO change the state of the application here!
          // $state.go(data.state, data.toParams);
          break;
        case 'upload-and-new':
          const file = new File([data.distribution], data.name, {type: data.type});
          this.dispatch.uploadFile(file)
            .then(
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
