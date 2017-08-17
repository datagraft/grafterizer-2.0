import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'pipelineFunctionFilter',
  pure: false
})
export class PipelineFunctionFilterPipe implements PipeTransform {

  transform(items: any, filter: Object): any {
    if (!items || !filter) {
            return items;
        }
    return items.filter(item => item.type.indexOf(filter) !== -1);
  }

}
