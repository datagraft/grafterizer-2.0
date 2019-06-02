import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {
  ConciliatorService, EventConfigurator,
  Extension,
  Mapping,
  Property,
  ReconciledColumn,
  WeatherConfigurator, WeatherObservation,
  WeatherParameter,
  Event
} from './enrichment.model';
import {AppConfig} from '../../app.config';
import {forkJoin} from 'rxjs/observable/forkJoin';
import * as moment from 'moment';
import {TabularAnnotationComponent} from '../tabular-annotation.component';
import {UrlUtilsService} from '../shared/url-utils.service';

@Injectable()
export class EnrichmentService {

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

    values = values.filter(function (e) {
      return e === 0 || e;
    });  // remove empty strings

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

    values = values.filter(function (e) {
      return e === 0 || e;
    });  // remove empty strings

    const extensions: Extension[] = [];
    values.forEach((value: string) => {
      extensions.push(new Extension(value, properties));
    });

    const queryProperties = properties.map(prop => ({'id': prop}));
    const extendQuery = {ids: values, properties: queryProperties};

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

      return {ext: extensions, props: propDescriptions};
    });
  }

  weatherData(on: string, weatherConfig: WeatherConfigurator): Observable<Extension[]> {
    let geoIds = [];
    if (weatherConfig.getReadPlacesFromCol()) {
      geoIds = this.data.map(row => row[':' + weatherConfig.getReadPlacesFromCol()]);
      geoIds = Array.from(new Set(geoIds)).filter(function (e) {
        return e === 0 || e;
      });  // remove empty strings
    } else {
      geoIds.push(weatherConfig.getPlace());
    }

    let dates = [];
    let originalDateFormat;
    if (weatherConfig.getReadDatesFromCol()) {
      dates = this.data.map(row => row[':' + weatherConfig.getReadDatesFromCol()] + '');
      dates = Array.from(new Set(dates)).filter(function (e) {
        return e === 0 || e;
      });  // remove empty strings
      if (dates.length > 0) {
        originalDateFormat = moment(dates[0]).creationData().format; // assuming a date column uses the same format for each date
      }
      dates = dates.map(date => moment(date + '').format());
    } else {
      dates.push(moment(weatherConfig.getDate()).toISOString(true));
      originalDateFormat = moment(dates[0]).creationData().format;
    }

    const requestURL = this.asiaURL + '/weather';

    const params = new HttpParams()
      .set('ids', geoIds.join(','))
      .set('dates', dates.join(','))
      .set('weatherParams', weatherConfig.getParameters().join(','))
      .set('offsets', weatherConfig.getOffsets().join(','));

    return this.http.post(requestURL, params).map((results: any) => {
      results.sort(function (a, b) {
        return a.offset - b.offset;
      }); // sort results by offset
      const extensions: Map<string, Extension> = new Map();
      results.forEach(obs => {
        const weatherObs = new WeatherObservation(obs);
        const properties: Map<string, any[]> = new Map();

        // Save dates using the original format adopted by the user
        const date = moment(weatherObs.getDate()).format(originalDateFormat);

        if (on === 'date') {
          // Create extensions based on date
          let extension = extensions.get(date);
          if (!extension) {
            extension = new Extension(date, []);
          }
          weatherObs.getWeatherParameters().forEach((weatherParam: WeatherParameter) => {
            const newParamName = `WF_${weatherParam.getId()}_${weatherObs.getGeonamesId()}_+${weatherObs.getOffset()}`;
            for (const agg of weatherConfig.getAggregators()) {
              const v = weatherParam.get(agg);
              if (v) {
                properties.set(`${newParamName}_${agg}`, [{'str': `${v}`}]);
              }
            }
          });
          extension.addProperties(properties);
          extensions.set(date, extension);
        } else if (on === 'place') {
          // Create extensions based on place
          let extension = extensions.get(weatherObs.getGeonamesId());
          if (!extension) {
            extension = new Extension(weatherObs.getGeonamesId(), []);
          }

          weatherObs.getWeatherParameters().forEach((weatherParam: WeatherParameter) => {
            const newParamName = `WF_${weatherParam.getId()}_${weatherObs.getDate()}_+${weatherObs.getOffset()}`;
            for (const agg of weatherConfig.getAggregators()) {
              const v = weatherParam.get(agg);
              if (v) {
                properties.set(`${newParamName}_${agg}`, [{'str': `${v}`}]);
              }
            }
          });
          extension.addProperties(properties);
          extensions.set(weatherObs.getGeonamesId(), extension);
        }
      });
      return Array.from(extensions.values());
    });
  }//end weatherData

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
            extension = new Extension(date, []);
          }
          properties.set('eventsCount', [{'str': `${event.getEventsCount()}`}]);
          extension.addProperties(properties);
          extensions.set(date, extension);
        } else if (on === 'place') {
          // Create extensions based on place
          let extension = extensions.get(event.getGeonamesId());
          if (!extension) {
            extension = new Extension(event.getGeonamesId(), []);
          }
          properties.set('eventsCount', [{'str': `${event.getEventsCount()}`}])
          extension.addProperties(properties);
          extensions.set(event.getGeonamesId(), extension);
        } else if (on === 'category') {
          // Create extensions based on category

          // In this case (extend from category column), only one category is expected
          // If any result exists, a category must be set (only one)
          let extension = extensions.get(event.getCategories()[0]);
          if (!extension) {
            extension = new Extension(event.getCategories()[0], []);
          }
          properties.set('eventsCount', [{'str': `${event.getEventsCount()}`}])
          extension.addProperties(properties);
          extensions.set(event.getCategories()[0], extension);
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
    if (header.toLowerCase().search('date') !== -1)
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
            prop.name = prop.name.replace(UrlUtilsService.getNamespaceFromURL(new URL(prop.name)), '');
          }
          return prop;
        });
      });
  };

  public listServices = (): Observable<Object> => {
    const url = this.asiaURL + '/services';
    return this.http
      .get(url);
  };

  getReconciliationServiceOfColumn(header: string) {
    return new ConciliatorService(this.getReconciledColumn(header).getConciliator());
  }

  geoNamesAutocomplete(keyword) {
    if (keyword && keyword.length > 1 ) {
      const params = new HttpParams()
        .set('q', keyword)
        .set('maxRows', '50')
        .set('featureClass', 'A')
        .set('username', 'asia_geo');

      const url = 'http://api.geonames.org/searchJSON';

      return this.http
        .get(url, { params: params })
        .map(res => res['geonames']);
    }
    return Observable.of([]);
  }

  googleCategoriesAutocomplete(keyword) {
    if (keyword && keyword.length > 1 ) {

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
