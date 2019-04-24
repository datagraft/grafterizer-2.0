import {Injectable} from '@angular/core';

@Injectable()
export class UrlUtilsService {

  static getNamespaceFromURL(url: URL) {
    let suffix = '';
    if (url.hash.length > 0) {
      suffix = url.hash.substring(1); // remove '#' char
    } else {
      suffix = url.pathname.substring(url.pathname.lastIndexOf('/') + 1);
    }
    return url.href.substring(0, url.href.indexOf(suffix));
  }

}
