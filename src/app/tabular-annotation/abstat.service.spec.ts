import { TestBed, inject } from '@angular/core/testing';

import { AbstatService } from './abstat.service';

describe('AbstatService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AbstatService]
    });
  });

  it('should be created', inject([AbstatService], (service: AbstatService) => {
    expect(service).toBeTruthy();
  }));
});
