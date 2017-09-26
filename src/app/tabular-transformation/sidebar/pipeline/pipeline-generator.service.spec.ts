import { TestBed, inject } from '@angular/core/testing';

import { PipelineGeneratorService } from './pipeline-generator.service';

describe('PipelineGeneratorService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PipelineGeneratorService]
    });
  });

  it('should be created', inject([PipelineGeneratorService], (service: PipelineGeneratorService) => {
    expect(service).toBeTruthy();
  }));
});
