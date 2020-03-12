export class Header {
  originalWord: string;
  processedWord: string;
  splitTerms: string[];
  translatedPhrases: TranslatedWord[];
  translatedWords: TranslatedWord[];
  manipulatedTranslatedPhrases: TranslatedWord[];
  language: string;
  propertySuggestions: Suggestion[];
  objectSuggestions: Suggestion[];
  subjectSuggestions: Suggestion[];
}

export class Suggestion {
  prefix: string;
  suggestion: string;
  namespace: string;
  entityName: string;
  occurrence: number;
  dataset: string;
  positionDataset: number;
  searchedKeyword: string;
  ratioIndex: number;
  calculatedIndex: number;
  suggesterScore: number;
  distances: number[];
}

export class TableSchema {
  columnList: Column[];
  language: string;
  forceSingleLanguage = true;
  languageWithStatsList: LanguageWithStats[];
}

export class TranslatedWord {
  translatedWord: string[];
  confidence: number;
  numOfWords: number;
}

export class LanguageWithStats {
  languageType: string;
  frequency: number;
}

export class Column {
  header: Header;
  dataType: string;
}
