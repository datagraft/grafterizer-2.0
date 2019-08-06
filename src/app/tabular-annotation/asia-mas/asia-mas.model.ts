export class Header {
  originalWord: string;
  processedWord: string;
  splitTerms: string[];
  translatedPhrases: TranslatedWord[];
  translatedWords: TranslatedWord[];
  manipulatedTranslatedPhrases: TranslatedWord[];
  language: LanguageType;
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

export enum LanguageType {
  EN = 'en',
  FR = 'fr',
  IT = 'it',
  DE = 'de',
  ES = 'es',
  SI = 'si',
  UNKNOWN = 'unknown'
}

export enum Suggester {
  ABSTAT = 'abstat',
  LOV = 'lov'
}

export class TableSchema {
  columnList: Column[];
  Language: LanguageType;
  forceSingleLanguage = true;
  languageWithStatsList: LanguageWithStats[];
}

export class TranslatedWord {
  translatedWord: string[];
  confidence: number;
  numOfWords: number;
}

export class LanguageWithStats {
  languageType: LanguageType;
  frequency: number;
}

export class Column {
  header: Header;
  dataType: string;
}
