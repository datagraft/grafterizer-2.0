import { TestBed, inject } from '@angular/core/testing';

import { TransformationUpdaterService } from './transformation-updater.service';

describe('TransformationUpdaterService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TransformationUpdaterService]
    });
  });

  it('should be created', inject([TransformationUpdaterService], (service: TransformationUpdaterService) => {
    expect(service).toBeTruthy();
  }));
});
