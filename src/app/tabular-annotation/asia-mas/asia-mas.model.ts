export class Header {
  private originalWord: string;
  private processedWord: string;
  private splitTerms: string[];
  private translatedPhrases: TranslatedWord[];
  private translatedWords: TranslatedWord[];
  private manipulatedTranslatedPhrases: TranslatedWord[];
  private language: LanguageType;
  private propertySuggestions: Suggestion[];
  private objectSuggestions: Suggestion[];
  private subjectSuggestions: Suggestion[];

  constructor(originalWord: string, processedWord: string, splitTerms: string[], translatedPhrases: TranslatedWord[],
              translatedWords: TranslatedWord[], manipulatedTranslatedPhrases: TranslatedWord[], language: LanguageType,
              propertySuggestions: Suggestion[], objectSuggestions: Suggestion[], subjectSuggestions: Suggestion[]) {
    this.originalWord = originalWord;
    this.processedWord = processedWord;
    this.splitTerms = splitTerms;
    this.translatedPhrases = translatedPhrases;
    this.translatedWords = translatedWords;
    this.manipulatedTranslatedPhrases = manipulatedTranslatedPhrases;
    this.language = language;
    this.propertySuggestions = propertySuggestions;
    this.objectSuggestions = objectSuggestions;
    this.subjectSuggestions = subjectSuggestions;
  }
}

export class Suggestion {
  private prefix: string;
  private suggestion: string;
  private namespace: string;
  private entityName: string;
  private occurrence: number;
  private dataset: string;
  private positionDataset: number;
  private searchedKeyword: string;
  private ratioIndex: number;
  private calculatedIndex: number;
  private suggesterScore: number;
  private distances: number[];


  constructor(prefix: string, suggestion: string, namespace: string, entityName: string, occurrence: number, dataset: string,
              positionDataset: number, searchedKeyword: string, ratioIndex: number, calculatedIndex: number, suggesterScore: number,
              distances: number[]) {
    this.prefix = prefix;
    this.suggestion = suggestion;
    this.namespace = namespace;
    this.entityName = entityName;
    this.occurrence = occurrence;
    this.dataset = dataset;
    this.positionDataset = positionDataset;
    this.searchedKeyword = searchedKeyword;
    this.ratioIndex = ratioIndex;
    this.calculatedIndex = calculatedIndex;
    this.suggesterScore = suggesterScore;
    this.distances = distances;
  }
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

export class TableSchema {
  private columnList: Column[];
  private Language: LanguageType;
  private forceSingleLanguage = true;
  private languageWithStatsList: LanguageWithStats[];

  constructor(columnList: Column[], Language: LanguageType, forceSingleLanguage: boolean, languageWithStatsList: LanguageWithStats[]) {
    this.columnList = columnList;
    this.Language = Language;
    this.forceSingleLanguage = forceSingleLanguage;
    this.languageWithStatsList = languageWithStatsList;
  }

  public addColumn(column: Column) {
    this.columnList.push(column);
  }
}

export class TranslatedWord {
  private translatedWord: string[];
  private confidence: number;
  private numOfWords: number;

  constructor(translatedWord: string[], confidence: number, numOfWords: number) {
    this.translatedWord = translatedWord;
    this.confidence = confidence;
    this.numOfWords = numOfWords;
  }
}

export class LanguageWithStats {
  private languageType: LanguageType;
  private frequency: number;

  constructor(languageType: LanguageType, frequency: number) {
    this.languageType = languageType;
    this.frequency = frequency;
  }
}

export class Column {
  private header: Header;
  private dataType: string;

  constructor(header: Header, datatype: string) {
    this.header = header;
    this.dataType = datatype;
  }
}
