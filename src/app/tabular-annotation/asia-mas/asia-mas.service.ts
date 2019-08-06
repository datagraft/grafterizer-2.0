import {Injectable} from '@angular/core';
import {AppConfig} from '../../app.config';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';
import {UrlUtils} from '../shared/url-utils';
import {StringUtils} from '../shared/string-utils';
import {Column, Header, Suggester} from './asia-mas.model';

@Injectable({
  providedIn: 'root'
})
export class AsiaMasService {

  private suggester: Suggester;
  private readonly masEndpoint: string;
  private readonly abstatAutocompleteEndpoint: string;
  private preferredSummaries: string[];

  constructor(private config: AppConfig, private http: HttpClient) {
    this.masEndpoint = this.config.getConfig('asia-mas');
    this.abstatAutocompleteEndpoint = this.config.getConfig('abstat-path') + '/api/v1/SolrSuggestions';
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
        language: null,
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
      this.masEndpoint + '/suggester/api/column/translate',
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
  public abstatAutocomplete(keyword, position, filter = true): Observable<any[]> {
    if (keyword && position) {
      keyword = UrlUtils.filterURI(keyword);
      if (filter) {
        keyword = StringUtils.stringPreprocessing(keyword);
      }
      let params = new HttpParams()
        .set('qString', keyword)
        .set('qPosition', position)
        .set('rows', '15')
        .set('start', '0');
      if (this.preferredSummaries.length > 0 && this.suggester === 'abstat') {
        params = params.set('dataset', this.preferredSummaries.join(','));
      }

      return this.http.get(this.abstatAutocompleteEndpoint, { params: params })
        .map(res => res['suggestions']);
    }
    return Observable.of([]);
  }

  public getSummaries = (suggester: string): Observable<Object> => {
    const url = this.masEndpoint + '/suggester/api/summaries';
    const params = new HttpParams().set('suggester', suggester);
    return this.http.get(url, { params: params });
  }

  public getPreferredSummaries(): string[] {
    return this.preferredSummaries;
  }

  public setPreferredSummaries(preferredSummaries: string[]) {
    this.preferredSummaries = preferredSummaries;
  }

  public setSuggester(suggester: Suggester) {
    this.suggester = suggester;
  }

  public getSuggester(): Suggester {
    return this.suggester;
  }
}
