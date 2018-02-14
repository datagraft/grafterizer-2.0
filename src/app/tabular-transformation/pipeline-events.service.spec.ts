import { TestBed, inject } from '@angular/core/testing';

import { PipelineEventsService } from './pipeline-events.service';

describe('PipelineEventsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PipelineEventsService]
    });
  });

  it('should be created', inject([PipelineEventsService], (service: PipelineEventsService) => {
    expect(service).toBeTruthy();
  }));
});
