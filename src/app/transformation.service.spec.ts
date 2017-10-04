import { TestBed, inject } from '@angular/core/testing';

import { TransformationService } from './transformation.service';

describe('TransformationService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TransformationService]
    });
  });

  it('should be created', inject([TransformationService], (service: TransformationService) => {
    expect(service).toBeTruthy();
  }));
});
