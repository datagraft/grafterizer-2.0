import { TestBed, inject } from '@angular/core/testing';

import { RecommenderService } from './recommender.service';

describe('RecommenderService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RecommenderService]
    });
  });

  it('should be created', inject([RecommenderService], (service: RecommenderService) => {
    expect(service).toBeTruthy();
  }));
});
