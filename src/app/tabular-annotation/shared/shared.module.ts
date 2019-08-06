import {NgModule} from '@angular/core';
import {UrlUtils} from './url-utils';
import {StringUtils} from './string-utils';

@NgModule({
  providers: [
    UrlUtils,
    StringUtils
  ]
})
export class SharedModule { }
