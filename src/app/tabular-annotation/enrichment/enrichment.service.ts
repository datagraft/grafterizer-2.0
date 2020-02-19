import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import {
  ConciliatorService,
  Event,
  EventConfigurator,
  Extension,
  Id,
  Property,
  PropertyValue,
  PropertyValueId,
  PropertyValueNumber,
  PropertyValueString,
  QueryResult,
  ReconciledColumn,
  ReconciliationQuery,
  Result,
  Type,
  TypeStrict,
  WeatherConfigurator,
  WeatherObservation,
  WeatherParameter
} from './enrichment.model';
import { AppConfig } from '../../app.config';
import { forkJoin } from 'rxjs/observable/forkJoin';
import * as moment from 'moment';
import { UrlUtils } from '../shared/url-utils';


// MANUEL

export function getDateData() {
  return require('../../../../JSON.json')
}

export function getEventData() {
  return require('../../../../JSON copy.json')
}


// END MANUEL

@Injectable()
export class EnrichmentService {

  public headers: string[];
  public data;
  private reconciledColumns: {};
  private asiaURL;

  
  public reconciliationServicesMapSource: BehaviorSubject<Map<string, ConciliatorService>>;

  constructor(private http: HttpClient, private config: AppConfig) {
    this.headers = [];
    this.data = [];
    this.reconciledColumns = {};
    this.asiaURL = this.config.getConfig('asia-backend');
    let emptyServiceMap = new Map<string, ConciliatorService>();
    this.reconciliationServicesMapSource = new BehaviorSubject<Map<string, ConciliatorService>>(emptyServiceMap);
  }

  /**
   * Return the most frequent type of matched entities.
   * Return null only if no candidates have been found for all mentions
   * @param mappings
   */
  getMostFrequentType(mappings: QueryResult[]): Type {
    const totalScore = {};
    const numCandidates = {};
    const numQueries = {};
    const types = {};

    // Filter responses with no results and all results with score = 0 (which are "false positive" that should not be returned from server)
    mappings = mappings.filter(x => x.results.length > 0 && x.results.filter(y => y.score > 0).length > 0);

    mappings.forEach((mapping: QueryResult) => {
      mapping.results.forEach((result: Result) => {
        result.types.forEach((type: Type) => {
          if (!totalScore[type.id]) {
            totalScore[type.id] = 0;
            numCandidates[type.id] = 0;
            numQueries[type.id] = new Set();
          }
          totalScore[type.id] += result.score;
          numCandidates[type.id] += 1;
          numQueries[type.id].add(mapping.reconciliationQuery.getQuery());

          types[type.id] = type;
        });
      });
    });

    const scores = {};

    /* Score computation for type X
     * totalScore(X): sum of scores given to all candidates of type X
     * numCandidates(X): number of candidates of type X (across all results)
     * numQueries(X): number of queries answered with at least one candidate of type X
     * QR: number of queries answered with at least one candidate
     *
     * score(X) = totalScore(X) * (numQueries(X) / QR) * (numQueries(X) / numCandidates(X))
     */
    Object.keys(numQueries).forEach((property: string) => {
      scores[property] = totalScore[property] *
        (numQueries[property].size * numQueries[property].size) /
        (mappings.length * numCandidates[property]);
    });

    if (Object.keys(scores).length > 0) {
      const bestTypeId = Object.keys(scores).reduce(function (a, b) {
        return scores[a] > scores[b] ? a : b;
      });
      return types[bestTypeId];
    }

    return null;
  }

  /**
   * Helper method to generate the reconciliation HTTP post request, given a list of queries
   * @param queries
   * @param conciliator
   */
  private getAsiaReconciliationRequest(queries: Map<string, ReconciliationQuery>, conciliator: ConciliatorService) {
    const requestURL = `${this.asiaURL}/reconcile`;

    const queriesObj = {};
    Array.from(queries.entries()).forEach(x => queriesObj[x[0]] = x[1]);

    const params = new HttpParams()
      .set('queries', JSON.stringify(queriesObj))
      .set('conciliator', conciliator.getId());

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded'
      }),
      params: params
    };

    return this.http.post(requestURL, null, httpOptions);
  }

  /**
   * Exec the reconciliation query and return a list of QueryResult objects
   * @param qResults
   * @param service
   */
  private execQueries(qResults: QueryResult[], service: ConciliatorService): Observable<QueryResult[]> {
    const requests = [];

    const resultsMap = new Map<string, QueryResult>();

    for (let index = 0; index < qResults.length; index += 10) {
      const queriesMap = new Map<string, ReconciliationQuery>();
      qResults.slice(index, index + 10).forEach((qr, idx) => {
        resultsMap.set(`q${index + idx}`, qr);
        queriesMap.set(`q${index + idx}`, qr.reconciliationQuery);
      });
      requests.push(this.getAsiaReconciliationRequest(queriesMap, service));
    }

    return forkJoin(requests).map((results: any) => {
      results.forEach(res => {
        Object.keys(res).forEach(queryId => {
          resultsMap.get(queryId).setResultsFromService(res[queryId]['result']);
        });
      });
      return Array.from(resultsMap.values());
    });
  }

  /**
   * Reconcile the selected column (header), using the reconciliation service passed as parameter.
   * This method uses the most frequent types computed on a sample of size sampleSize as the columnType.
   * @param header the header of the column to reconcile
   * @param selectedProperties
   * @param selectedColumns
   * @param service the reconciliation service to use
   * @param sampleSize number of rows to use for determining the most frequent entity type (default is 10).
   */
  reconcileColumn(header: string, selectedProperties: string[],
    selectedColumns: string[], service: ConciliatorService, sampleSize: number = 10): Observable<QueryResult[]> {

    const colData = this.data.filter(function (row) { // remove empty strings
      return row[':' + header] === 0 || row[':' + header];  // Consider the trailing ':' char from EDN response
    }).map(row => { // remove unused fields from rows
      return [header].concat(selectedColumns).reduce((o, k) => {
        o[k] = row[':' + k]; // Do not consider the trailing ':' from now on
        return o;
      }, {});
    }).reduce((arr, item) => { // remove duplicates
      const exists = !!arr.find(x => {
        let ex = true;
        [header].concat(selectedColumns).forEach(col => {
          ex = ex && x[col] === item[col];
        });
        return ex;
      });
      if (!exists) {
        arr.push(item);
      }
      return arr;
    }, []).map(item => {
      // Create the object needed for the reconciliation (value to reconcile + propertyValues)
      return { value: item[header], properties: this.getPropertyValues(item, selectedColumns, selectedProperties, service) };
    });

    // reconcile #sampleSize values for guessing the column type
    return this.execQueries(colData.slice(0, sampleSize).map((v: { value, properties }) => new QueryResult(
      new ReconciliationQuery(v.value, undefined, undefined, undefined, v.properties), [])),
      service).flatMap(
        results => {
          // reconcile all rows against the most frequent type
          const type: Type = this.getMostFrequentType(results);
          if (type) {
            return this.execQueries(colData.map((v: { value, properties }) => new QueryResult(
              new ReconciliationQuery(v.value, type.id, TypeStrict.SHOULD, undefined, v.properties), [])), service);
          } else {
            return this.execQueries(colData.map((v: { value, properties }) => new QueryResult(
              new ReconciliationQuery(v.value, undefined, undefined, undefined, v.properties), [])), service);
          }
        });
  }

  private getPropertyValues(row: [string], selectedColumn, selectedProperties, conciliator: ConciliatorService): PropertyValue[] {
    return selectedColumn.map((col, index) => {
      if (this.isColumnReconciled(col) && this.getReconciliationServiceOfColumn(col).getId() === conciliator.getId()) {
        // Column reconciled against the same service used for this reconciliation -> return value as ID
        return new PropertyValueId(selectedProperties[index], new Id(row[col]));
      } else if (!isNaN(Number(row[col]))) {
        // The column contains numbers -> return value as Number
        return new PropertyValueNumber(selectedProperties[index], Number(row[col]));
      } else {
        // The column contains just strings -> return value as String
        return new PropertyValueString(selectedProperties[index], row[col]);
      }
    });
  }

  extendColumn(header: string, properties: string[]): Observable<{ ext: Extension[], props: Property[] }> {
    const colData = this.data.map(row => row[':' + header]);
    let values = Array.from(new Set(colData));

    values = values.filter(function (e) {
      return e === 0 || e;
    });  // remove empty strings

    const extensions: Extension[] = [];
    values.forEach((value: string) => {
      extensions.push(new Extension([value], properties));
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
        extension.setResultsFromService(res['rows'][extension.key[0]]);
      });
      const propDescriptions: Property[] = [];
      res['meta'].forEach(p => propDescriptions.push(new Property(p)));

      return { ext: extensions, props: propDescriptions };
    });
  }

  sameasData(header: string, sameAsSource: ConciliatorService, sameAsDestination: ConciliatorService): Observable<Extension[]> {
    // taken all values of the column without duplicates and empty values
    const colData = this.data.map(row => row[':' + header]);
    let values = Array.from(new Set(colData));

    values = values.filter(function (e) { return e === 0 || e; });  // remove empty strings

    // create objects {id:..., properties:{prop1:[], prp2:[],...}}
    const extensions: Extension[] = [];

    const requestURL = this.asiaURL + '/exactMatch';

    // create query params
    const params = new HttpParams()
      .set('ids', values.join(','))
      .set('source', sameAsSource.getId() === 'wikifier' ? 'dbpedia' : sameAsSource.getId()) // TODO: allow to change the conciliator
      .set('target', sameAsDestination.getId());

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded'
      }),
      params: params
    };

    return this.http.post(requestURL, null, httpOptions).map(res => {
      const results = res['rows'];
      const property = res['meta']['name'];

      Object.keys(results).forEach((row) => {
        // const rowId = results[row][property][0];
        const currExt = new Extension([row], [property]);
        currExt.setResultsFromService(results[row]);
        extensions.push(currExt);
      });

      return extensions;
    });
  }

  weatherData(on: string, weatherConfig: WeatherConfigurator): Observable<Extension[]> {

    let header;
    let auxCol;
    if (on === 'place') {
      header = weatherConfig.getReadPlacesFromCol();
      auxCol = weatherConfig.getReadDatesFromCol();
    } else {
      header = weatherConfig.getReadDatesFromCol();
      auxCol = weatherConfig.getReadPlacesFromCol();
    }

    const cols = auxCol ? [header, auxCol] : [header];

    const colData = this.data.filter((row) => { // remove empty strings
      let notEmpty = true;
      for (let i = 0; i < cols.length; i++) {
        notEmpty = notEmpty && (row[':' + cols[i]] === 0 || row[':' + cols[i]]); // Consider the trailing ':' char from EDN response
      }
      return notEmpty;
    }).map(row => { // remove unused fields from rows
      return cols.reduce((o, k) => {
        o[k] = row[':' + k]; // Do not consider the trailing ':' from now on
        return o;
      }, {});
    }).reduce((arr, item) => { // remove duplicates
      const exists = !!arr.find(x => {
        let ex = true;
        cols.forEach(col => {
          ex = ex && x[col] === item[col];
        });
        return ex;
      });
      if (!exists) {
        arr.push(item);
      }
      return arr;
    }, []).map(item => {
      let date;
      let isoDate;
      let originalDateFormat;
      // Create the object needed for the weather extension (value to reconcile + propertyValues)
      if (on === 'place') {
        if (auxCol) {
          date = `${item[auxCol]}`;
          isoDate = moment(date).format();
          originalDateFormat = moment(date).creationData().format;
        } else {
          date = `${weatherConfig.getDate()}`;
          isoDate = moment(weatherConfig.getDate(), 'MM/DD/YYYY').toISOString(true);
          originalDateFormat = 'MM/DD/YYYY';
        }
        return { place: `${item[header]}`, date: date, isoDate: isoDate, originalDateFormat: originalDateFormat };
      } else {
        date = `${item[header]}`;
        isoDate = moment(date).format();
        originalDateFormat = moment(date).creationData().format;
        if (auxCol) {
          return { date: date, place: `${item[auxCol]}`, isoDate: isoDate, originalDateFormat: originalDateFormat };
        } else {
          return { date: date, place: `${weatherConfig.getPlace()}`, isoDate: isoDate, originalDateFormat: originalDateFormat };
        }
      }
    });

    const requestURL = this.asiaURL + '/weather';

    const params = new HttpParams()
      .set('ids', Array.from(new Set(colData.map(row => row.place))).join(','))
      .set('dates', Array.from(new Set(colData.map(row => row.isoDate))).join(','))
      .set('weatherParams', weatherConfig.getParameters().join(','))
      .set('offsets', weatherConfig.getOffsets().join(','));

    return this.http.post(requestURL, params).map((results: any) => {
      results.sort(function (a, b) {
        return a.offset - b.offset; // sort results by offset
      });
      console.log('------------http results------------')
      console.log(typeof(results))
      const extensions: Extension[] = [];

      colData.forEach(row => {

        const key = [];
        const properties: Map<string, any[]> = new Map();

        if (on === 'place') {
          key.push(row.place);
          if (auxCol) {
            key.push(row.date);
          }
        } else {
          key.push(row.date);
          if (auxCol) {
            key.push(row.place);
          }
        }

        const e = new Extension(key, []);

        // Many weather obs, one for each offset
        const weatherObs = results.filter((res) => {
          const obs = new WeatherObservation(res);
          return obs.getGeonamesId() === row.place && moment(obs.getDate()).format(row.originalDateFormat) === row.date;
        });

        weatherObs.forEach(res => {
          const obs = new WeatherObservation(res);
          // console.log('----res----')
          // console.log(res)
          // console.log('----obs----')
          // console.log(obs)
          obs.getWeatherParameters().forEach((weatherParam: WeatherParameter) => {
            let propName = `WF_${weatherParam.getId()}_+${obs.getOffset()}`;
            if (weatherConfig.getPlace()) {
              propName += `_${obs.getGeonamesId()}`;
            }
            if (weatherConfig.getDate()) {
              propName += `_${obs.getDate()}`;
            }
            for (const agg of weatherConfig.getAggregators()) {
              const v = weatherParam.get(agg);
              if (v) {
                properties.set(`${propName}_${agg}`, [{ 'str': `${v}` }]);
              }
            }
          });
        });
        
        // console.log('----------properties-----------')
        // console.log(properties)

        e.addProperties(properties);
        // console.log('----------e-----------')
        // console.log(e)

        extensions.push(e);
      });
      return extensions;
    });
  } // end weatherData

  eventData(on: string, eventConfig: EventConfigurator): Observable<Extension[]> {
    let geoIds = [];
    if (eventConfig.getReadPlacesFromCol()) {
      geoIds = this.data.map(row => row[':' + eventConfig.getReadPlacesFromCol()]);
      geoIds = Array.from(new Set(geoIds)).filter(function (e) {
        return e === 0 || e;
      });  // remove empty strings
    } else {
      geoIds = eventConfig.getPlaces();
    }

    let dates = [];
    let originalDateFormat;
    if (eventConfig.getReadDatesFromCol()) {
      dates = this.data.map(row => row[':' + eventConfig.getReadDatesFromCol()] + '');
      dates = Array.from(new Set(dates)).filter(function (e) {
        return e === 0 || e;
      });  // remove empty strings
      if (dates.length > 0) {
        originalDateFormat = moment(dates[0]).creationData().format; // assuming a date column uses the same format for each date
      }
      dates = dates.map(date => moment(date + '').format());
    } else {
      dates.push(moment(eventConfig.getDate()).toISOString(true));
      originalDateFormat = moment(dates[0]).creationData().format; // assuming a date column uses the same format for each date
    }

    let categories = [];
    if (eventConfig.getReadCategoriesFromCol()) {
      categories = this.data.map(row => row[':' + eventConfig.getReadCategoriesFromCol()]);
      categories = Array.from(new Set(categories)).filter(function (e) {
        return e === 0 || e;
      });  // remove empty strings
    } else {
      categories = eventConfig.getCategories();
    }

    const requestURL = this.asiaURL + '/events';

    const params = new HttpParams()
      .set('ids', geoIds.join(','))
      .set('dates', dates.join(','))
      .set('categories', categories.join(','));

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded'
      }),
      params: params
    };

    return this.http.post(requestURL, null, httpOptions).map((results: any) => {
      results.sort(function (a, b) {
        return a.offset - b.offset;
      }); // sort results by offset
      const extensions: Map<string, Extension> = new Map();
      results.forEach(obs => {
        const event = new Event(obs);
        const properties: Map<string, any[]> = new Map();

        const date = moment(event.getEventDate()).format(originalDateFormat);

        if (on === 'date') {
          // Create extensions based on date
          let extension = extensions.get(date);
          if (!extension) {
            extension = new Extension([date], []);
          }
          properties.set('eventsCount', [{ 'str': `${event.getEventsCount()}` }]);
          extension.addProperties(properties);
          extensions.set(date, extension);
        } else if (on === 'place') {
          // Create extensions based on place
          let extension = extensions.get(event.getGeonamesId());
          if (!extension) {
            extension = new Extension([event.getGeonamesId()], []);
          }
          properties.set('eventsCount', [{ 'str': `${event.getEventsCount()}` }]);
          extension.addProperties(properties);
          extensions.set(event.getGeonamesId(), extension);
        } else if (on === 'category') {
          // Create extensions based on category

          // In this case (extend from category column), only one category is expected
          // If any result exists, a category must be set (only one)
          let extension = extensions.get(event.getCategories()[0]);
          if (!extension) {
            extension = new Extension([event.getCategories()[0]], []);
          }
          properties.set('eventsCount', [{ 'str': `${event.getEventsCount()}` }]);
          extension.addProperties(properties);
          extensions.set(event.getCategories()[0], extension);
        }
      });
      return Array.from(extensions.values());
    });
  } // end weatherData


  // MANUEL
  dateData(on: string, payload, cols){
    payload['queries'].forEach(element => {
      let key = []
      if (element.isColumn) {
        key.push(element.value)
      }
    });
    console.log('---payload----')
    console.log(payload)

    // let response = this.http.post(requestURL, payload, httpOptions)
    // console.log('response')
    // console.log(response)

    const requestURL = this.asiaURL + '/customevents/match';

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      }),
    };
    const extensions: Extension[] = [];
    this.http.post(requestURL, payload, httpOptions).map((results: any) => {
    // let results = getDateData();
      
      console.log('--Results--')
      console.log(results)
      results.forEach(res => {
        const properties: Map<string, any[]> = new Map();
        
        console.log('--------------res--------------')
        console.log(res)
        let e = new Extension(res['key'], []);
        let concat = ''
        properties.set('results', [{str: res['results'].join(', ')}])
        e.addProperties(properties)
        extensions.push(e)
      });
      console.log(extensions)
      return extensions;

    });
    return []
  }
      // const colData = this.data.filter((row) => { // remove empty strings
      //   let notEmpty = true;
      //   for (let i = 0; i < cols.length; i++) {
      //     notEmpty = notEmpty && (row[':' + cols[i]] === 0 || row[':' + cols[i]]); // Consider the trailing ':' char from EDN response
      //   }
      //   return notEmpty;
      // }).map(row => { // remove unused fields from rows
      //   return cols.reduce((o, k) => {
      //     o[k] = row[':' + k]; // Do not consider the trailing ':' from now on
      //     return o;
      //   }, {});
      // }).reduce((arr, item) => { // remove duplicates
      //   const exists = !!arr.find(x => {
      //     let ex = true;
      //     cols.forEach(col => {
      //       ex = ex && x[col] === item[col];
      //     });
      //     return ex;
      //   });
      //   if (!exists) {
      //     arr.push(item);
      //   }
      //   return arr;
      // }, [])
  

    // let data = getDateData()
    
    // console.log(getDateData())
    // console.log('---data---')
    // console.log(data)

  getEventsExtension(on, url){

    const extensions: Extension[] = [];
    
    this.http.get(url).map((results: any) => {
      
      // let results = getEventData()
      
      console.log('--url--')
      console.log(url)
      
      
      console.log('--static Data--')
      console.log(Object.keys(results.result))
      
      // const properties: Map<string, any[]> = new Map();
      
      results.result.forEach(res => {
        
        let e = new Extension([res['id']], []);
        console.log('--res--')
        console.log(res)
        Object.keys(res).forEach(k => {
          if (k != 'id'){
            const properties: Map<string, any[]> = new Map();  
            properties.set(k, [{'str' : res[k]}])
            e.addProperties(properties)
          }
        });
        
        extensions.push(e)      
      });
      console.log('-extensions-')
      console.log(extensions)
      return extensions;
    });

    return []
  } 

  
  // END MANUEL

  setReconciledColumn(reconciledColumn: ReconciledColumn) {
    this.reconciledColumns[reconciledColumn.getHeader()] = reconciledColumn;
  }

  isColumnReconciled(header: string): boolean {
    return Object.keys(this.reconciledColumns).includes(header);
  }

  isColumnDate(header: string): boolean {
    return header.toLowerCase().search('date') !== -1;
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

  public propertiesAvailable = (service: ConciliatorService): Observable<any> => {
    const requestURL = this.asiaURL + '/propose_properties';

    const params = new HttpParams()
      .set('limit', '50')
      .set('conciliator', service.getId());

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded'
      }),
      params: params
    };

    return this.http.post(requestURL, null, httpOptions).map((results: any) => {
      return results['properties'].map(prop => {
        // Sometimes an URI is received as prop name (when a "name" is not available) -> use the suffix as name
        if (prop.name.startsWith('http://') || prop.name.startsWith('https://')) {
          prop.name = prop.name.replace(UrlUtils.getNamespaceFromURL(new URL(prop.name)), '');
        }
        return prop;
      });
    });
  }

  public listServices = (): Observable<Object> => {
    const url = this.asiaURL + '/services';
    return this.http
      .get(url);
  }

  getReconciliationServiceOfColumn(header: string) {
    return new ConciliatorService(this.getReconciledColumn(header).getConciliator());
  }

  geoNamesAutocomplete(keyword) {
    if (keyword && keyword.length > 1) {
      const params = new HttpParams()
        .set('q', keyword)
        .set('maxRows', '50')
        .set('featureClass', 'A')
        .set('username', 'asia_geo');

      const url = 'http://api.geonames.org/searchJSON';

      let result = this.http
              .get(url, { params: params })
              .map(res => res['geonames']);
      return result

      // PREVIOUS CODE (the one which works before)
      // return this.http
      //   .get(url, { params: params })
      //   .map(res => res['geonames']);
    }
    return Observable.of([]);
  }

  getText1Values(keyword) {
    return [keyword + 'A', keyword + 'B', keyword + 'C']
  }

  googleCategoriesAutocomplete(keyword) {
    if (keyword && keyword.length > 1) {

      const params = new HttpParams()
        .set('queries', '{"q0": {"query": "' + keyword + '"}}')
        .set('conciliator', 'productsservices');

      const httpOptions = {
        headers: new HttpHeaders({
          'Content-Type': 'application/x-www-form-urlencoded'
        }),
        params: params
      };

      const url = this.asiaURL + '/reconcile';

      return this.http.post(url, null, httpOptions)
        .map(res => res['q0']['result']);
    }
    return Observable.of([]);
  }

}
