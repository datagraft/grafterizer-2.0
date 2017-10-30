import { TestBed, inject } from '@angular/core/testing';

import { HandsontableService } from './handsontable.service';

describe('HandsontableService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HandsontableService]
    });
  });

  it('should be created', inject([HandsontableService], (service: HandsontableService) => {
    expect(service).toBeTruthy();
  }));
});
