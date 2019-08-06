import {Injectable} from '@angular/core';
import {AppConfig} from '../app.config';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import 'rxjs/add/operator/map';
import {UrlUtils} from './shared/url-utils';
import {StringUtils} from './shared/string-utils';

@Injectable()
export class AnnotationSuggesterService {

  private suggester: string;
  private readonly suggesterEndpoint: string;
  private readonly abstatAutocompleteEndpoint: string;
  private preferredSummaries: string[];

  constructor(private config: AppConfig, private http: HttpClient) {
    this.suggesterEndpoint = this.config.getConfig('asia-mas');
    this.abstatAutocompleteEndpoint = this.config.getConfig('abstat-path') + '/api/v1/SolrSuggestions';
    this.preferredSummaries = [];
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
    const url = this.suggesterEndpoint + '/suggester/api/summaries';
    const params = new HttpParams().set('suggester', suggester);
    return this.http.get(url, { params: params });
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

}
