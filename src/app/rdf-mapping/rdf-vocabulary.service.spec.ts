import { TestBed, inject } from '@angular/core/testing';

import { RdfVocabularyService } from './rdf-vocabulary.service';

describe('RdfVocabularyService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RdfVocabularyService]
    });
  });

  it('should be created', inject([RdfVocabularyService], (service: RdfVocabularyService) => {
    expect(service).toBeTruthy();
  }));
});
