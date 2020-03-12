import { TestBed, inject } from '@angular/core/testing';

import { EnrichmentService } from './enrichment.service';

describe('EnrichmentService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EnrichmentService]
    });
  });

  it('should be created', inject([EnrichmentService], (service: EnrichmentService) => {
    expect(service).toBeTruthy();
  }));
});
