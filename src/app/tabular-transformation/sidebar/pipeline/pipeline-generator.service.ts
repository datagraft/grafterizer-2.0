import { Injectable } from '@angular/core';

@Injectable()
export class PipelineGeneratorService {

  constructor() { }

  public generatePipeline(_function) {
    this.pipeline.pipelines["0"].functions.push(_function);
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
