import { TestBed, inject } from '@angular/core/testing';

import { TransformationDataModelService } from './transformation-data-model.service';

describe('TransformationDataModelService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TransformationDataModelService]
    });
  });

  it('should be created', inject([TransformationDataModelService], (service: TransformationDataModelService) => {
    expect(service).toBeTruthy();
  }));
});
