import { TestBed, inject } from '@angular/core/testing';

import { ArangoGeneratorService } from './arango-generator.service';

describe('ArangoGeneratorService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ArangoGeneratorService]
    });
  });

  it('should be created', inject([ArangoGeneratorService], (service: ArangoGeneratorService) => {
    expect(service).toBeTruthy();
  }));
});
