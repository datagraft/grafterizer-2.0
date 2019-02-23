import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ConciliatorService,
  Extension,
  Mapping,
  Property,
  ReconciledColumn,
  WeatherConfigurator, WeatherObservation,
  WeatherParameter
} from './enrichment.model';
import { AppConfig } from '../../app.config';
import { forkJoin } from 'rxjs/observable/forkJoin';
import * as moment from 'moment';

@Injectable()
export class EnrichmentService {

  private constResponse = { 'q1': { 'result': [] }, 'q2': { 'result': [{ 'id': '9171308', 'name': 'Victoria', 'type': [{ 'id': 'http://www.geonames.org/ontology#S.HTL', 'name': 'S.HTL' }], 'score': 1.0, 'match': true }, { 'id': '6477265', 'name': 'Victoria', 'type': [{ 'id': 'http://www.geonames.org/ontology#S.HTL', 'name': 'S.HTL' }], 'score': 1.0, 'match': false }, { 'id': '10295254', 'name': 'Victoria', 'type': [{ 'id': 'http://www.geonames.org/ontology#S.THTR', 'name': 'S.THTR' }], 'score': 1.0, 'match': false }, { 'id': '10242712', 'name': 'Victoria', 'type': [{ 'id': 'http://www.geonames.org/ontology#S.HTL', 'name': 'S.HTL' }], 'score': 1.0, 'match': false }, { 'id': '6477349', 'name': 'Victoria', 'type': [{ 'id': 'http://www.geonames.org/ontology#S.HTL', 'name': 'S.HTL' }], 'score': 1.0, 'match': false }, { 'id': '6355286', 'name': 'Gasteiz / Vitoria', 'type': [{ 'id': 'http://www.geonames.org/ontology#A.ADM3', 'name': 'A.ADM3' }], 'score': 0.9666666666666667, 'match': false }, { 'id': '3104499', 'name': 'Vitoria-Gasteiz', 'type': [{ 'id': 'http://www.geonames.org/ontology#P.PPLA', 'name': 'P.PPLA' }], 'score': 0.9666666666666667, 'match': false }, { 'id': '6357260', 'name': 'Victoria, La', 'type': [{ 'id': 'http://www.geonames.org/ontology#A.ADM3', 'name': 'A.ADM3' }], 'score': 0.9629629629629629, 'match': false }, { 'id': '2515119', 'name': 'La Victoria', 'type': [{ 'id': 'http://www.geonames.org/ontology#P.PPL', 'name': 'P.PPL' }], 'score': 0.9090909090909092, 'match': false }, { 'id': '6525501', 'name': 'Nh Victoria', 'type': [{ 'id': 'http://www.geonames.org/ontology#S.HTL', 'name': 'S.HTL' }], 'score': 0.9090909090909092, 'match': false }, { 'id': '3104497', 'name': 'Bitoriano', 'type': [{ 'id': 'http://www.geonames.org/ontology#P.PPL', 'name': 'P.PPL' }], 'score': 0.9074074074074073, 'match': false }] }, 'q3': { 'result': [{ 'id': '2177478', 'name': 'Australian Capital Territory', 'type': [{ 'id': 'http://www.geonames.org/ontology#A.ADM3', 'name': 'A.ADM3' }], 'score': 1.0, 'match': true }] }, 'q4': { 'result': [] }, 'q5': { 'result': [] }, 'q6': { 'result': [] }, 'q7': { 'result': [] }, 'q0': { 'result': [] } };
  private extResponse = { 'rows': { '6355286': { 'geocoordinates': [{ 'str': '(-9.5, 9.3)' }], 'country': [] }, '2177478': { 'country': [{ 'name': 'Australia', 'id': 'http://sws.geonames.org/2077456/' }], 'geocoordinates': [{ 'str': '(-35.5, 149)' }] } } };

  public headers: string[];
  public data;
  private reconciledColumns: {};

  private asiaURL;

  constructor(private http: HttpClient, private config: AppConfig) {
    this.headers = [];
    this.data = [];
    this.reconciledColumns = {};
    this.asiaURL = this.config.getConfig('asia-backend');
  }

  reconcileColumn(header: string, service: ConciliatorService): Observable<Mapping[]> {
    const colData = this.data.map(row => row[':' + header]);
    let values = Array.from(new Set(colData));

    values = values.filter(function (e) { return e === 0 || e; });  // remove empty strings

    const mappings = new Map<string, Mapping>();
    const queries = [];
    values.forEach((value: string, index: number) => {
      const m = new Mapping(index, value);
      mappings.set(m.queryId, m);
      queries.push(m.getServiceQuery());
    });

    const requestURL = `${this.asiaURL}/reconcile`;

    const chunks = [];

    while (queries.length) {
      chunks.push(queries.splice(0, 10));
    }

    const requests = [];
    chunks.forEach(chunk => {
      const params = new HttpParams()
        .set('queries', `{${chunk.join(',')}}`)
        .set('conciliator', service.getId());

      const httpOptions = {
        headers: new HttpHeaders({
          'Content-Type': 'application/x-www-form-urlencoded'
        }),
        params: params
      };

      requests.push(this.http.post(requestURL, null, httpOptions));
    });

    // // TODO: remove after solving CORS issue
    // mappings.forEach((mapping: Mapping) => {
    //   mapping.setResultsFromService(this.constResponse[mapping.queryId]['result']);
    // });
    // return Observable.of(mappings);

    return forkJoin(requests).map((results: any) => {
      results.forEach(res => {
        Object.keys(res).forEach(queryId => {
          mappings.get(queryId).setResultsFromService(res[queryId]['result']);
        });
      });
      return Array.from(mappings.values());
    });
  }

  extendColumn(header: string, properties: string[]): Observable<{ ext: Extension[], props: Property[] }> {
    const colData = this.data.map(row => row[':' + header]);
    let values = Array.from(new Set(colData));

    values = values.filter(function (e) { return e === 0 || e; });  // remove empty strings

    const extensions: Extension[] = [];
    values.forEach((value: string) => {
      extensions.push(new Extension(value, properties));
    });

    const queryProperties = properties.map(prop => ({ 'id': prop }));
    const extendQuery = { ids: values, properties: queryProperties };

    const requestURL = this.asiaURL + '/extend';

    const params = new HttpParams()
      .set('extend', JSON.stringify(extendQuery))
      .set('conciliator', this.getReconciliationServiceOfColumn(header).getId());

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded'
      }),
      params: params
    };

    return this.http.post(requestURL, null, httpOptions).map(res => {
      extensions.forEach((extension: Extension) => {
        extension.setResultsFromService(res['rows'][extension.id]);
      });
      const propDescriptions: Property[] = [];
      res['meta'].forEach(p => propDescriptions.push(new Property(p)));

      return { ext: extensions, props: propDescriptions };
    });
  }

  weatherData(header: string,singlePlace: boolean, weatherConfig: WeatherConfigurator): Observable<Extension[]> {
    let geoIds = [];
    if(singlePlace){
       geoIds.push(header);

    }
    else
    {
         geoIds = this.data.map(row => row[':' + header]);
        geoIds = Array.from(new Set(geoIds)).filter(function (e) { return e === 0 || e; });  // remove empty strings
    }
    let dates = [];
    if (weatherConfig.getReadDatesFromCol())
    {
      dates = this.data.map(row => row[':' + weatherConfig.getReadDatesFromCol()]);
      dates = Array.from(new Set(dates)).filter(function (e) { return e === 0 || e; });  // remove empty strings
      dates = dates.map(date => moment(date + '').format());
      console.log(dates);
    }
    else
    {
      dates.push(moment(weatherConfig.getDate()).toISOString(true));
    }

    const requestURL = this.asiaURL + '/weather';

    const params = new HttpParams()
      .set('ids', geoIds.join(','))
      .set('dates', dates.join(','))
      .set('aggregators', weatherConfig.getAggregators().join(','))
      .set('weatherParams', weatherConfig.getParameters().join(','))
      .set('offsets', weatherConfig.getOffsets().join(','));

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded'
      }),
      params: params
    };

    return this.http.post(requestURL, null, httpOptions).map((results: any) => {
      results.sort(function (a, b) { return a.offset - b.offset }); // sort results by offset
      const extensions: Map<string, Extension> = new Map();
      results.forEach(obs => {
        const weatherObs = new WeatherObservation(obs);
        const properties: Map<string, any[]> = new Map();

        if(singlePlace)
        {
          const date = weatherObs.getValidTime().substring(0, 10).replace("-", "").replace("-", "");

          let extension = extensions.get(date);
          if (!extension)
          {
            extension = new Extension(date, []);
          }
          weatherObs.getWeatherParameters().forEach((weatherParam: WeatherParameter) => {
            const newParamName = `WF_${weatherParam.getId()}_${header}_+${weatherObs.getOffset()}`;
            properties.set(newParamName, [{ 'str': `${weatherParam.getValue()}` }]);
          });
          extension.addProperties(properties);
          extensions.set(date, extension);

        }
        else
        {
          const date = weatherObs.getValidTime().substring(0, 10).replace("-", "").replace("-", "");

          let extension = extensions.get(weatherObs.getGeonamesId());
          if (!extension)
          {
            extension = new Extension(weatherObs.getGeonamesId(), []);
          }

          weatherObs.getWeatherParameters().forEach((weatherParam: WeatherParameter) => {
            const newParamName = `WF_${weatherParam.getId()}_${weatherObs.getValidTime()}_+${weatherObs.getOffset()}`;
            properties.set(newParamName, [{ 'str': `${weatherParam.getValue()}` }]);
          });
          extension.addProperties(properties);
          extensions.set(weatherObs.getGeonamesId(), extension);
      }
      });
      return Array.from(extensions.values());
    });
  }//end weatherData

  setReconciledColumn(reconciledColumn: ReconciledColumn) {
    this.reconciledColumns[reconciledColumn.getHeader()] = reconciledColumn;
  }

  isColumnReconciled(header: string): boolean {
    return Object.keys(this.reconciledColumns).includes(header);
  }

  isColumnDate(header: string): boolean {
    if( header.toLowerCase().search('date') !== -1)
      return true;
    else
      return false;
  }


  getReconciledColumns(): ReconciledColumn[] {
    const recCols = [];
    Object.keys(this.reconciledColumns).forEach(key => recCols.push(this.reconciledColumns[key]));
    return recCols;
  }

  getReconciledColumn(header: string): ReconciledColumn {
    return this.reconciledColumns[header];
  }

  removeReconciledColumn(columnHeader: string) {
    delete this.reconciledColumns[columnHeader];
  }

  public propertiesAvailable = (): Observable<any> => {
    const properties = [
      { 'id': 'parentADM1', 'name': 'level 1 administrative parent' },
      { 'id': 'parentADM2', 'name': 'level 2 administrative parent' },
      { 'id': 'parentADM3', 'name': 'level 3 administrative parent' },
      { 'id': 'parentADM4', 'name': 'level 4 administrative parent' }
    ];
    return Observable.of(properties);
    // return Observable.of(['parentADM1', 'parentADM2', 'parentADM3', 'parentADM4']);
  }

  public listServices = (): Observable<Object> => {
    const url = this.asiaURL + '/services';
    return this.http
      .get(url);
  }

  getReconciliationServiceOfColumn(header: string) {
    return new ConciliatorService(this.getReconciledColumn(header).getConciliator());
  }
}
