import {Injectable} from '@angular/core';
import {AppConfig} from '../app.config';
import * as nlp from 'wink-nlp-utils';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';

@Injectable()
export class AbstatService {

  private abstatBasePath: string;
  private preferredSummaries: string[];

  static stringPreprocessing(string) {
    // remove special chars (e.g. _)
    string = nlp.string.retainAlphaNums(string);
    // split camelCase words
    string = string
    // insert a space between lower & upper
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      // space before last upper in a sequence followed by lower
      .replace(/\b([A-Z]+)([A-Z])([a-z])/, '$1 $2$3')
      // uppercase the first character
      .replace(/^./, function(str) { return str.toUpperCase(); });
    // tokenize string
    let tokens = nlp.string.tokenize(string);
    // remove stop words
    tokens = nlp.tokens.removeWords(tokens);
    // create string from tokens
    string = tokens.join(' ');
    return string;
  }

  constructor(private config: AppConfig, private http: HttpClient) {
    this.abstatBasePath = this.config.getConfig('abstat-path');
    this.preferredSummaries = [];
  }

  /**
   * Get suggestions from ABSTAT
   * TODO: change the URI with ASIA path
   * @param keyword
   * @param position
   * @returns {any}
   */
  private abstatSuggestions(keyword, position) {
    if (keyword && position ) {
      let params = new HttpParams()
        .set('qString', keyword)
        .set('qPosition', position)
        .set('rows', '15')
        .set('start', '0');
      if (this.preferredSummaries.length > 0) {
        params = params.set('dataset', this.preferredSummaries.join(','));
      }
      const url = this.abstatBasePath + '/api/v1/SolrSuggestions';

      return this.http
        .get(url, {params: params})
        .map(res => res['suggestions']);
    }
    return Observable.of([]);
  }

  /**
   * Search for type suggestions
   * @param keyword
   * @param {boolean} filter
   * @returns {Observable<any[]>}
   */
  public typeSuggestions = (keyword: any, filter = true): Observable<any[]> => {
    if (filter) {
      keyword = AbstatService.stringPreprocessing(keyword);
    }
    return this.abstatSuggestions(keyword, 'subj');
  }

  /**
   * Search for property suggestions
   * @param keyword
   * @param {boolean} filter
   * @returns {Observable<any[]>}
   */
  public propertySuggestions = (keyword: any, filter = true): Observable<any[]> => {
    if (filter) {
      keyword = AbstatService.stringPreprocessing(keyword);
    }
    return this.abstatSuggestions(keyword, 'pred');
  }

  public listSummaries = (): Observable<Response> => {
    const url = this.abstatBasePath + '/api/v1/datasets';
    return this.http
      .get(url)
      .map(res => {
        const datasets = res['datasets'];
        datasets.forEach(dataset => dataset['summary_name'] = dataset['URI'].substr(dataset['URI'].lastIndexOf('/') + 1));
        return datasets;
      });
  }

  public getPreferredSummaries(): string[] {
    return this.preferredSummaries;
  }

  public updatePreferredSummaries(summaries: string[]) {
    this.preferredSummaries = summaries;
  }
}
