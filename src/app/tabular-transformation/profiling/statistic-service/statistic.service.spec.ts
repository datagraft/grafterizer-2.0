import { TestBed, inject } from '@angular/core/testing';

import { StatisticService } from './statistic.service';

describe('StatisticService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StatisticService]
    });
  });

  it('should be created', inject([StatisticService], (service: StatisticService) => {
    expect(service).toBeTruthy();
  }));
});
