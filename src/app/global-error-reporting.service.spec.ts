import { TestBed, inject } from '@angular/core/testing';

import { GlobalErrorReportingService } from './global-error-reporting.service';

describe('GlobalErrorReportingService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GlobalErrorReportingService]
    });
  });

  it('should be created', inject([GlobalErrorReportingService], (service: GlobalErrorReportingService) => {
    expect(service).toBeTruthy();
  }));
});
