import {Injectable} from '@angular/core';

@Injectable()
export class UrlUtils {

  static getNamespaceFromURL(url: URL) {
    let suffix = '';
    if (url.hash.length > 0) {
      suffix = url.hash.substring(1); // remove '#' char
    } else {
      suffix = url.pathname.substring(url.pathname.lastIndexOf('/') + 1);
    }
    return url.href.substring(0, url.href.indexOf(suffix));
  }

  /**
   * If the given string starts with 'http', returns the last component of the URL.
   * The last component is detected by looking at '/', '#' and ':'.
   * @param string
   * @returns {any}
   */
  static filterURI(string) {
    if (string.startsWith('http')) {
      const slashIdx = string.lastIndexOf('/');
      const hashIdx = string.lastIndexOf('#');
      const colonIdx = string.lastIndexOf(':');
      string = string.substr(Math.max(slashIdx, hashIdx, colonIdx));
    }
    return string;
  }

}
