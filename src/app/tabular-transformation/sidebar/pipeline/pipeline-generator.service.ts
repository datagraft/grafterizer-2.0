import { Injectable } from '@angular/core';

@Injectable()
export class PipelineGeneratorService {

  constructor() { }

  public generatePipeline(transformationDataModelFunction) {
    this.pipeline.pipelines["0"].functions.push(transformationDataModelFunction);
  }

  public pipeline: any = {
    "customFunctionDeclarations": [],
    "prefixers": [],
    "pipelines": [{
      "functions": [],
      "__type": "Pipeline"
    }],
    "graphs": [],
    "rdfVocabs": []
  }

}
