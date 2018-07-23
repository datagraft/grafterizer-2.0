import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';
import {Mapping} from './enrichment.model';

@Injectable()
export class EnrichmentService {

  private constResponse = {"q1":{"result":[]},"q2":{"result":[{"id":"http://sws.geonames.org/9171308/","name":"Victoria","type":[{"id":"http://www.geonames.org/ontology#S.HTL","name":"S.HTL"}],"score":1.0,"match":true},{"id":"http://sws.geonames.org/6477265/","name":"Victoria","type":[{"id":"http://www.geonames.org/ontology#S.HTL","name":"S.HTL"}],"score":1.0,"match":false},{"id":"http://sws.geonames.org/10295254/","name":"Victoria","type":[{"id":"http://www.geonames.org/ontology#S.THTR","name":"S.THTR"}],"score":1.0,"match":false},{"id":"http://sws.geonames.org/10242712/","name":"Victoria","type":[{"id":"http://www.geonames.org/ontology#S.HTL","name":"S.HTL"}],"score":1.0,"match":false},{"id":"http://sws.geonames.org/6477349/","name":"Victoria","type":[{"id":"http://www.geonames.org/ontology#S.HTL","name":"S.HTL"}],"score":1.0,"match":false},{"id":"http://sws.geonames.org/6355286/","name":"Gasteiz / Vitoria","type":[{"id":"http://www.geonames.org/ontology#A.ADM3","name":"A.ADM3"}],"score":0.9666666666666667,"match":false},{"id":"http://sws.geonames.org/3104499/","name":"Vitoria-Gasteiz","type":[{"id":"http://www.geonames.org/ontology#P.PPLA","name":"P.PPLA"}],"score":0.9666666666666667,"match":false},{"id":"http://sws.geonames.org/6357260/","name":"Victoria, La","type":[{"id":"http://www.geonames.org/ontology#A.ADM3","name":"A.ADM3"}],"score":0.9629629629629629,"match":false},{"id":"http://sws.geonames.org/2515119/","name":"La Victoria","type":[{"id":"http://www.geonames.org/ontology#P.PPL","name":"P.PPL"}],"score":0.9090909090909092,"match":false},{"id":"http://sws.geonames.org/6525501/","name":"Nh Victoria","type":[{"id":"http://www.geonames.org/ontology#S.HTL","name":"S.HTL"}],"score":0.9090909090909092,"match":false},{"id":"http://sws.geonames.org/3104497/","name":"Bitoriano","type":[{"id":"http://www.geonames.org/ontology#P.PPL","name":"P.PPL"}],"score":0.9074074074074073,"match":false}]},"q3":{"result":[{"id":"http://sws.geonames.org/2177478/","name":"Australian Capital Territory","type":[{"id":"http://www.geonames.org/ontology#A.ADM1","name":"A.ADM1"}],"score":1.0,"match":true}]},"q4":{"result":[]},"q5":{"result":[]},"q6":{"result":[]},"q7":{"result":[]},"q0":{"result":[]}};

  public headers: string[];
  public data;
  private reconciledColumns: {};

  private baseURL = 'http://localhost:8080/reconcile/geonames?queries=';

  constructor(private http: HttpClient) {
    this.headers = [];
    this.data = [];
    this.reconciledColumns = {};
  }

  reconcileColumn(header: string, serviceType: string): Observable<Mapping[]> {
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

    const requestURL = this.baseURL + '{' + queries.join(',') + '}';
    // console.log(requestURL);

    // TODO: remove after solving CORS issue
    mappings.forEach((mapping: Mapping) => {
      mapping.setResultsFromService(this.constResponse[mapping.queryId]['result']);
    });
    return Observable.of(mappings);

    // return this.http.get(requestURL)
    //   .map(res => {
    //
    //     mappings.forEach((mapping: Mapping) => {
    //       mapping.setResultsFromService(res[mapping.queryId]['result']);
    //     });
    //
    //     return mappings;
    //   });
  }

  setReconciledColumn(header: string, pipelineFunction) {
    this.reconciledColumns[header] = pipelineFunction;
  }

  isColumnReconciled(header: string): boolean {
    return Object.keys(this.reconciledColumns).includes(header);
  }

  getReconciledColumns(): any[] {
    const recCols = [];
    Object.keys(this.reconciledColumns).forEach(key => recCols.push(this.reconciledColumns[key]));
    return recCols;
  }

  removeReconciledColumn(columnHeader: string) {
    delete this.reconciledColumns[columnHeader];
  }

}
