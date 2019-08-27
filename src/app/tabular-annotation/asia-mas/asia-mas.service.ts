import {Injectable} from '@angular/core';
import {AppConfig} from '../../app.config';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';
import {UrlUtils} from '../shared/url-utils';
import {StringUtils} from '../shared/string-utils';
import {Column} from './asia-mas.model';

@Injectable({
  providedIn: 'root'
})
export class AsiaMasService {

  private suggester: string;
  private language: string;
  private readonly masEndpoint: string;
  private preferredSummaries: string[];

  constructor(private config: AppConfig, private http: HttpClient) {
    this.masEndpoint = this.config.getConfig('asia-mas') + '/suggester/api';
    this.preferredSummaries = [];
  }

  /**
   * Multilingual annotation suggestions (column-based)
   * @param keyword
   */

  masSuggestion(keyword): Observable<Column> {
    const col: Column = {
      header: {
        originalWord: keyword,
        processedWord: null,
        subjectSuggestions: null,
        language: this.language,
        manipulatedTranslatedPhrases: null,
        objectSuggestions: null,
        propertySuggestions: null,
        splitTerms: null,
        translatedPhrases: null,
        translatedWords: null
      },
      dataType: null
    };

    const params = new HttpParams()
      .set('suggester', this.suggester)
      .set('preferredSummaries', this.preferredSummaries.join(','));
    return this.http.put<Column>(
      this.masEndpoint + '/column/translate',
      col,
      {params: params});
  }

  /**
   * Autocomplete from ABSTAT
   * @param keyword
   * @param position - one of subj or pred
   * @param {boolean} filter
   * @returns {Observable<any[]>}
   */
  public abstatAutocomplete(keyword, position, filter = true): Observable<Object> {
    if (keyword && position) {
      keyword = UrlUtils.filterURI(keyword);
      if (filter) {
        keyword = StringUtils.stringPreprocessing(keyword);
      }
      let params = new HttpParams()
        .set('keyword', keyword)
        .set('position', position);
      if (this.preferredSummaries.length > 0 && this.suggester.toLowerCase() === 'abstat') {
        params = params.set('preferredSummaries', this.preferredSummaries.join(','));
      }

      return this.http.get(this.masEndpoint + '/autocomplete/en', { params: params });
    }
    return Observable.of([]);
  }

  public getSummariesList = (suggester: string): Observable<Object> => {
    const url = this.masEndpoint + '/summaries';
    const params = new HttpParams().set('suggester',  suggester);
    return this.http.get(url, { params: params });
  }

  public getSuggestersList = (): Observable<Object> => {
    const url = this.masEndpoint + '/suggesters';
    return this.http.get(url);
  }

  public getLanguagesList = (): Observable<Object> => {
    const url = this.masEndpoint + '/languages';
    return this.http.get(url);
  }

  public getPreferredSummaries(): string[] {
    return this.preferredSummaries;
  }

  public setPreferredSummaries(preferredSummaries: string[]) {
    this.preferredSummaries = preferredSummaries;
  }

  public setSuggester(suggester: string) {
    this.suggester = suggester;
  }

  public getSuggester(): string {
    return this.suggester;
  }

  public getLanguage(): string {
    return this.language;
  }

  public setLanguage(language: string) {
    this.language = language;
  }
}
