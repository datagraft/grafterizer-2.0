//Generic class for pipeline functions

declare var jsedn:any;
export class PipelineFunction {
  isPreviewed: boolean;
  generateClojure() {};
//todo: constructor using future transformationdatamodel
  constructor(public name: string, __type:string) {
   this.generateClojure = function() {return new jsedn.List([new jsedn.sym(name)])};
  }
}