import { TestBed, inject } from '@angular/core/testing';

import { AnnotationSuggesterService } from './annotation-suggester.service';

describe('AnnotationSuggesterService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AnnotationSuggesterService]
    });
  });

  it('should be created', inject([AnnotationSuggesterService], (service: AnnotationSuggesterService) => {
    expect(service).toBeTruthy();
  }));
});
