import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';
import {Extension, Mapping, ReconciledColumn} from './enrichment.model';
import {AppConfig} from '../../app.config';

@Injectable()
export class EnrichmentService {

  private constResponse = {"q1":{"result":[]},"q2":{"result":[{"id":"http://sws.geonames.org/9171308/","name":"Victoria","type":[{"id":"http://www.geonames.org/ontology#S.HTL","name":"S.HTL"}],"score":1.0,"match":true},{"id":"http://sws.geonames.org/6477265/","name":"Victoria","type":[{"id":"http://www.geonames.org/ontology#S.HTL","name":"S.HTL"}],"score":1.0,"match":false},{"id":"http://sws.geonames.org/10295254/","name":"Victoria","type":[{"id":"http://www.geonames.org/ontology#S.THTR","name":"S.THTR"}],"score":1.0,"match":false},{"id":"http://sws.geonames.org/10242712/","name":"Victoria","type":[{"id":"http://www.geonames.org/ontology#S.HTL","name":"S.HTL"}],"score":1.0,"match":false},{"id":"http://sws.geonames.org/6477349/","name":"Victoria","type":[{"id":"http://www.geonames.org/ontology#S.HTL","name":"S.HTL"}],"score":1.0,"match":false},{"id":"http://sws.geonames.org/6355286/","name":"Gasteiz / Vitoria","type":[{"id":"http://www.geonames.org/ontology#A.ADM3","name":"A.ADM3"}],"score":0.9666666666666667,"match":false},{"id":"http://sws.geonames.org/3104499/","name":"Vitoria-Gasteiz","type":[{"id":"http://www.geonames.org/ontology#P.PPLA","name":"P.PPLA"}],"score":0.9666666666666667,"match":false},{"id":"http://sws.geonames.org/6357260/","name":"Victoria, La","type":[{"id":"http://www.geonames.org/ontology#A.ADM3","name":"A.ADM3"}],"score":0.9629629629629629,"match":false},{"id":"http://sws.geonames.org/2515119/","name":"La Victoria","type":[{"id":"http://www.geonames.org/ontology#P.PPL","name":"P.PPL"}],"score":0.9090909090909092,"match":false},{"id":"http://sws.geonames.org/6525501/","name":"Nh Victoria","type":[{"id":"http://www.geonames.org/ontology#S.HTL","name":"S.HTL"}],"score":0.9090909090909092,"match":false},{"id":"http://sws.geonames.org/3104497/","name":"Bitoriano","type":[{"id":"http://www.geonames.org/ontology#P.PPL","name":"P.PPL"}],"score":0.9074074074074073,"match":false}]},"q3":{"result":[{"id":"http://sws.geonames.org/2177478/","name":"Australian Capital Territory","type":[{"id":"http://www.geonames.org/ontology#A.ADM1","name":"A.ADM1"}],"score":1.0,"match":true}]},"q4":{"result":[]},"q5":{"result":[]},"q6":{"result":[]},"q7":{"result":[]},"q0":{"result":[]}};
  private extResponse = {"rows": {"http://sws.geonames.org/9171308/": {"geocoordinates": [], "country": []}, "http://sws.geonames.org/2177478/": {"country": [{"name": "Australia", "id": "http://sws.geonames.org/2077456/"}], "geocoordinates": [{"str": "(-35.5, 149)"}]}}};

  public headers: string[];
  public data;
  private reconciledColumns: {};

  // private baseURL = 'http://localhost:8080/reconcile/geonames?'; // TODO: change service URL and move it to config file
  private asiaURL;

  constructor(private http: HttpClient, private config: AppConfig) {
    this.headers = [];
    this.data = [];
    this.reconciledColumns = {};
    this.asiaURL = this.config.getConfig('asia-backend');
  }

  reconcileColumn(header: string, service: string): Observable<Mapping[]> {
    const colData = this.data.map(row => row[':' + header]);
    let values = Array.from(new Set(colData));

    values = values.filter(function(e) { return e === 0 || e; });  // remove empty strings

    const mappings = [];
    const queries = [];
    values.forEach((value: string, index: number) => {
      const m = new Mapping(index, value);
      mappings.push(m);
      queries.push(m.getServiceQuery());
    });

    const requestURL = `${this.asiaURL}/reconcile`;

    const params = new HttpParams()
      .set('queries', `{${queries.join(',')}}`)
      .set('conciliator', service);

    // TODO: remove after solving CORS issue
    mappings.forEach((mapping: Mapping) => {
      mapping.setResultsFromService(this.constResponse[mapping.queryId]['result']);
    });
    return Observable.of(mappings);

    // return this.http.get(requestURL, {params: params})
    //   .map(res => {
    //
    //     mappings.forEach((mapping: Mapping) => {
    //       mapping.setResultsFromService(res[mapping.queryId]['result']);
    //     });
    //
    //     return mappings;
    //   });
  }

  extendColumn(header: string, properties: string[]): Observable<Mapping[]> {
    const colData = this.data.map(row => row[':' + header]);
    let values = Array.from(new Set(colData));

    values = values.filter(function(e) { return e === 0 || e; });  // remove empty strings

    const extensions = [];
    values.forEach((value: string) => {
      extensions.push(new Extension(value, properties));
    });

    properties.map(prop => ({id: prop}));
    const extendQuery = {ids: values, properties: properties};

    // const requestURL = this.baseURL + 'extend=' + extendQuery;
    // console.log(requestURL);

    // TODO: remove after solving CORS issue
    extensions.forEach((extension: Extension) => {
      extension.setResultsFromService(this.extResponse['rows'][extension.id]);
    });
    return Observable.of(extensions);
  }

  setReconciledColumn(reconciledColumn: ReconciledColumn) {
    this.reconciledColumns[reconciledColumn.header] = reconciledColumn;
  }

  isColumnReconciled(header: string): boolean {
    return Object.keys(this.reconciledColumns).includes(header);
  }

  getReconciledColumns(): ReconciledColumn[] {
    const recCols = [];
    Object.keys(this.reconciledColumns).forEach(key => recCols.push(this.reconciledColumns[key]));
    return recCols;
  }

  removeReconciledColumn(columnHeader: string) {
    delete this.reconciledColumns[columnHeader];
  }

  public propertiesAvailable = (): Observable<any> => {
    return Observable.of(['population', 'country', 'geocoordinates']);
  }

  public listServices = (): Observable<Object> => {
    const url = this.asiaURL + '/services';
    return this.http
      .get(url);
  }
}
