import { TestBed, inject } from '@angular/core/testing';

import { DataGraftMessageService } from './data-graft-message.service';

describe('DataGraftMessageService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DataGraftMessageService]
    });
  });

  it('should be created', inject([DataGraftMessageService], (service: DataGraftMessageService) => {
    expect(service).toBeTruthy();
  }));
});
