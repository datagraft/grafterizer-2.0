import { TestBed } from '@angular/core/testing';

import { AsiaMasService } from './asia-mas.service';

describe('AsiaMasService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: AsiaMasService = TestBed.get(AsiaMasService);
    expect(service).toBeTruthy();
  });
});
