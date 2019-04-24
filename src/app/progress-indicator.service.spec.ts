import { TestBed, inject } from '@angular/core/testing';

import { ProgressIndicatorService } from './progress-indicator.service';

describe('ProgressIndicatorService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProgressIndicatorService]
    });
  });

  it('should be created', inject([ProgressIndicatorService], (service: ProgressIndicatorService) => {
    expect(service).toBeTruthy();
  }));
});
