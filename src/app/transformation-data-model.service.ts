import { Injectable } from '@angular/core';
import { PipelineFunction } from './pipeline/pipelineFunction';

declare var jsedn: any;
//import * as jsedn from 'jsedn';
@Injectable()
export class CustomFunctionDeclaration {

  private __type = 'CustomFunctionDeclaration';
  constructor(private name: any, private clojureCode: any, private group: any, private docstring: string) { }
  revive(data: any): CustomFunctionDeclaration {
    return new CustomFunctionDeclaration(data.name, data.clojureCode, data.group, data.docstring);
  }
}

@Injectable()
export class Prefixer {
  private __type = 'Prefixer';
  constructor(private name: any, private uri: any, private parentPrefix: any) { }
  revive(data: any): Prefixer {
    return new Prefixer(data.name, data.uri, data.parentPrefix);
  }
}

@Injectable()
export class Pipeline {
  private __type = 'Pipeline';
  constructor(private functions: PipelineFunction[]) {
    var i: number = 0;
    /*for (let f of functions){
 
         functions[i] = f.revive(f);
 
    }*/
  }
  revive(data: any): Pipeline {
    return new Pipeline(data.functions);
  }
  addAfter(funct: PipelineFunction, functionToAdd: PipelineFunction) {
    var index: number = this.functions.indexOf(funct);
    if (!functionToAdd || index === -1) {
      this.functions.push(functionToAdd);
    } else {
      if (index === this.functions.length - 1) {
        this.functions.push(functionToAdd);
        return true;
      } else {
        return this.functions.splice(index + 1, 0, functionToAdd);
      }
    }
  };
  removeFunction(funct: PipelineFunction) {
    var index = this.functions.indexOf(funct);
    this.functions.splice(index, 1);
  };
}


@Injectable()
export class Graph {
  private __type = 'Graph';
  addChild(child: any) { };
  replaceChild(child: any, nodeToReplaceWith: any) { };
  removeChild(child: any) { };
  addNodeAfter(root: any, rootToAdd: any) { };
  revive(data: any): Graph {
    return new Graph(data.child, data.nodeToReplaceWith);
  };
  constructor(graphURI: any, existingGraphRoots: any) {
  }
}

@Injectable()
export class RDFVocabulary {
  private __type = 'RDFVocabulary';

  revive(data: any): RDFVocabulary {
    return new RDFVocabulary(data.prefixName, data.namespaceURI, data.properties, data.classes);
  };
  constructor(prefixName: any, namespaceURI: any, properties: any, classes: any) {
  }
}

@Injectable()
export class MakeDatasetFunction extends PipelineFunction {
  constructor(public columnsArray: string[], public useLazy: boolean, public numberOfColumns: number, public moveFirstRowToHeader: boolean, public docstring: string) {
    super("make-dataset", "MakeDatasetFunction");
  }
  revive(data: any) {
    /*var columnsArray:string[];
        if (data.columnsArray.length > 0 && data.columnsArray[0] && !data.columnsArray[0].hasOwnProperty('id')) {
          for (let colname of data.columnsArray) {
            colname = {id:i, value:data.columnsArray[i]};
            columnsArray.push(colname);
          }
        } else {
          columnsArray = data.columnsArray;
        }*/
    return new MakeDatasetFunction(data.columnsArray, data.useLazy, data.numberOfColumns, data.moveFirstRowToHeader, data.docstring);
  };
  generateClojure() {
    var i;
    var colNamesClj = new jsedn.Vector([]);
    if (this.useLazy !== true) {
      if (this.moveFirstRowToHeader) {
        return new jsedn.List([
          jsedn.sym('->'),
          new jsedn.List([jsedn.sym('make-dataset'), jsedn.sym('move-first-row-to-header')]),
          new jsedn.List([jsedn.sym('rename-columns'),
          new jsedn.List([
            jsedn.sym('comp'),
            jsedn.sym('keyword'),
            jsedn.sym('new-tabular/string-as-keyword')])
          ])
        ]);
      }
      else {
        if (this.columnsArray.length > 0) {
          for (let column of this.columnsArray) {
            colNamesClj.val.push(new jsedn.kw(':' + column));
          }

          return new jsedn.List([jsedn.sym('make-dataset'), colNamesClj]);
        }

        else return new jsedn.List([jsedn.sym('make-dataset')]);
      }
    } else {
      // make dataset with lazy naming
      return new jsedn.List([jsedn.sym('make-dataset'),
      new jsedn.List([jsedn.sym('into []'),
      new jsedn.List([jsedn.sym('map'),
      jsedn.sym('keyword'),
      new jsedn.List([jsedn.sym('take'),
      this.numberOfColumns,
      new jsedn.List([jsedn.sym('grafter.sequences/alphabetical-column-names')])])])])]);
    }
  };
}

@Injectable()
export class Transformation {
  private __type = 'Transformation';
  constructor(private customFunctionDeclarations: any[], private prefixers: any[], private pipelines: any[], private graphs: any[], private rdfVocabs: any[]) {

    if (!customFunctionDeclarations)
      customFunctionDeclarations = [];
    if (!prefixers)
      prefixers = [];
    if (!pipelines)
      pipelines = [];
    if (!graphs)
      graphs = [];
    if (!rdfVocabs)
      rdfVocabs = [];
    var i: number = 0;
    for (let cfd of customFunctionDeclarations) {
      i++;
      if (!(cfd instanceof CustomFunctionDeclaration) && cfd.__type === "CustomFunctionDeclaration")
        customFunctionDeclarations[i] = cfd.revive(cfd);
    }

    i = 0;
    for (let prefixer of prefixers) {
      i++;
      if (!(prefixer instanceof Prefixer) && prefixer.__type === 'Prefixer') {

        prefixers[i] = prefixer.revive(prefixer);
      }
    }
    i = 0;
    for (let pipeline of pipelines) {
      i++;
      if (!(pipeline instanceof Pipeline) && pipeline.__type === 'Pipeline') {

        pipelines[i] = pipeline.revive(pipeline);
      }
    }
    i = 0;
    for (let graph of graphs) {
      i++;
      if (!(graph instanceof Graph) && graph.__type === 'Graph') {

        graphs[i] = graph.revive(graph);
      }
    }
    i = 0;
    for (let rdfVocab of rdfVocabs) {
      i++;
      if (!(rdfVocab instanceof RDFVocabulary) && rdfVocab.__type === 'RDFVocabulary') {

        rdfVocabs[i] = rdfVocab.revive(rdfVocab);
      }
    }





  }
}
