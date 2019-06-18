import { XSDDatatypes } from '../annotation.model';
import { UrlUtilsService } from '../shared/url-utils.service';

/**
 * Semantic type of the reconciled entities
 * @param  {Object} obj -
 */
export class Type {
  // identifier of the type (URI)
  public id: string;
  // label (human description) of the type
  public name: string;

  constructor(obj: Object) {
    this.id = obj['id'];
    this.name = obj['name'];
  }
}
/**
 * Reconciliation result for a query to the reconciliation API.
 * @param  {Object} obj
 */
export class Result {
  public id: string;
  public name: string;
  public types: Type[] = [];
  public score: number;
  // is confidence enough
  public match: boolean;

  constructor(obj: Object) {
    this.id = obj['id'];
    this.name = obj['name'];
    const tempTypes = obj['type'];
    for (let i = 0; i < tempTypes.length; ++i) {
      this.types.push(new Type(tempTypes[i]));
    }
    this.score = parseFloat(obj['score'].toFixed(2));
    this.match = obj['match'];
  }
}

/**
 * @param  {Object} obj
 */
export class Property {
  public id: string;
  public name: string;
  public type: Type;

  constructor(obj: Object) {
    this.id = obj['id'];
    this.name = obj['name'];
    this.type = obj['type'];
  }
}

enum TypeStrict {
  ANY = 'any',
  ALL = 'all',
  SHOULD = 'should'
}

export class ReconciliationQueryMap {
  private queryId: string;
  private reconciliationQuery: ReconciliationQuery;

  constructor(queryId: string, reconciliationQuery: ReconciliationQuery) {
    this.queryId = queryId;
    this.reconciliationQuery = reconciliationQuery;
  }

  getQueryId(): string {
    return this.queryId;
  }

  getReconciliationQuery(): ReconciliationQuery {
    return this.reconciliationQuery;
  }

}

export class ReconciliationQuery {
  private query: string;
  private limit: number;
  private type: string[];
  private type_strict: TypeStrict;
  // TODO: consider also properties here

  constructor(query, limit = 5, type = null, typeStrict = TypeStrict.ANY) {
    this.query = query;
    this.limit = limit;
    this.type = type;
    this.type_strict = typeStrict;
  }

  getQuery(): string {
    return this.query;
  }

  setQuery(query: string) {
    this.query = query;
  }

  getLimit(): number {
    return this.limit;
  }

  setLimit(limit: number) {
    this.limit = limit;
  }

  getType(): string[] {
    return this.type;
  }

  setType(type: string[]) {
    this.type = type;
  }

  getTypeStrict(): TypeStrict {
    return this.type_strict;
  }

  setTypeStrict(typeStrict: TypeStrict) {
    this.type_strict = typeStrict;
  }

}

export class Mapping {
  public reconciliationQuery: ReconciliationQuery;
  public results: Result[];

  constructor(reconciliationQuery: ReconciliationQuery) {
    this.reconciliationQuery = reconciliationQuery;
    this.results = [];
  }

  public addResult(res: Result) {
    this.results.push(res);
  }

  public setResultsFromService(res) {
    for (let i = 0; i < res.length; ++i) {
      this.addResult(new Result(res[i]));
    }
  }
}

export class Extension {
  public id: string;
  public properties: Map<string, any[]>;

  constructor(id: string, properties: string[]) {
    this.id = id;
    this.properties = new Map();
    properties.forEach(prop => this.properties.set(prop, []));
  }

  addProperties(properties: Map<string, any[]>) {
    properties.forEach((value, key) => this.properties.set(key, value));
  }

  public setResultsFromService(res) {
    Object.keys(res).forEach(key => this.properties.set(key, res[key]));
  }
}

export class DeriveMap {
  private deriveMap: {};
  public newColName: string;
  public newColTypes: Type[];
  public withProperty: string;
  public newColDatatype: string = null;

  constructor(newColName: string, withProperty: string) {
    this.deriveMap = {};
    this.newColTypes = [];
    this.withProperty = withProperty;
    this.newColName = newColName;
  }

  buildFromMapping(mapping: Mapping[], threshold: number, types: Type[]) {
    this.deriveMap = {};
    this.newColTypes = types;
    mapping.forEach(m => {
      if (m.results.length > 0 && m.results[0].match) {
        this.deriveMap[m.reconciliationQuery.getQuery()] = m.results[0].id; // TODO: iterate over results!
      }
    });
    return this;
  }

  buildFromExtension(selectedProperty: string, extensions: Extension[], types: Type[]) {
    this.deriveMap = {};
    this.newColTypes = types;
    extensions.forEach(e => {
      if (e.properties.has(selectedProperty) && e.properties.get(selectedProperty).length > 0) {
        const firstRes = e.properties.get(selectedProperty)[0];
        if (firstRes['id']) {
          this.deriveMap[e.id] = firstRes['id'];
        } else if (firstRes['str']) {
          this.deriveMap[e.id] = firstRes['str'];
          this.newColDatatype = XSDDatatypes.string;
        } else if (firstRes['date']) {
          this.deriveMap[e.id] = firstRes['date'];
          this.newColDatatype = XSDDatatypes.date;
        } else if (firstRes['float']) {
          this.deriveMap[e.id] = firstRes['float'];
          this.newColDatatype = XSDDatatypes.float;
        } else if (firstRes['int']) {
          this.deriveMap[e.id] = firstRes['int'];
          this.newColDatatype = XSDDatatypes.integer;
        } else if (firstRes['bool']) {
          this.deriveMap[e.id] = firstRes['bool'];
          this.newColDatatype = XSDDatatypes.boolean;
        }
      }
    });
    return this;
  }

  /**
   * Return the mapping as Clojure map -> {"key1" "value1" "key2" "value2" ... "keyN" "valueN"}
   * All whitespaces in key values are replaced with underscores
   * @returns {string}
   */
  toClojureMap(): string {
    let map = '{';
    Object.keys(this.deriveMap).forEach((key) => {
      map += `"${key}" "${this.deriveMap[key]}" `;
    });
    map += '}';
    return map;
  }

}

export class ConciliatorService {
  private id: string;
  private name: string;
  private group: string;
  private identifierSpace: string;
  private schemaSpace: string;

  constructor(obj: any) {
    this.id = obj && obj.id || '';
    this.name = obj && obj.name || '';
    this.group = obj && obj.group || '';
    this.identifierSpace = obj && obj.identifierSpace || '';
    this.schemaSpace = obj && obj.schemaSpace || '';
  }

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getGroup(): string {
    return this.group;
  }

  getIdentifierSpace(): string {
    return this.identifierSpace;
  }

  getSchemaSpace(): string {
    return this.schemaSpace;
  }
}

export class ReconciledColumn {
  private _deriveMap: DeriveMap;
  private _conciliator: ConciliatorService;


  constructor(deriveMap: DeriveMap, conciliator: ConciliatorService) {
    this._deriveMap = deriveMap;
    this._conciliator = conciliator;
  }

  getDeriveMap(): DeriveMap {
    return this._deriveMap;
  }

  getConciliator(): ConciliatorService {
    return this._conciliator;
  }

  getHeader(): string {
    return this._deriveMap.newColName;
  }
}

export class WeatherConfigurator {
  private parameters: string[];
  private aggregators: string[];
  private offsets: number[];
  private readDatesFromCol: string;
  private date: string;
  private readPlacesFromCol: string;
  private place: string;

  constructor(obj: any) {
    this.parameters = obj && obj.parameters || [];
    this.aggregators = obj && obj.aggregators || [];
    this.offsets = obj && obj.offsets || [];
    this.readDatesFromCol = obj && obj.readDatesFromCol || '';
    this.date = obj && obj.date || '';
    this.readPlacesFromCol = obj && obj.readPlacesFromCol || '';
    this.place = obj && obj.place || '';
  }


  getParameters(): string[] {
    return this.parameters;
  }

  getAggregators(): string[] {
    return this.aggregators;
  }

  getOffsets(): number[] {
    return this.offsets;
  }

  getReadDatesFromCol(): string {
    return this.readDatesFromCol;
  }

  getDate(): string {
    return this.date;
  }

  getReadPlacesFromCol(): string {
    return this.readPlacesFromCol;
  }

  getPlace(): string {
    return this.place;
  }
}

export class WeatherObservation {
  private geonamesId: string;
  private date: string;
  private weatherParameters: WeatherParameter[] = [];
  private offset: number;

  constructor(obj) {
    this.geonamesId = obj && obj.geonamesId || '';
    this.date = obj && obj.date || '';
    const tempParam = obj['weatherParameters'];
    for (let i = 0; i < tempParam.length; ++i) {
      this.weatherParameters.push(new WeatherParameter(tempParam[i]));
    }
    this.offset = obj && obj.offset || 0;
  }

  getGeonamesId(): string {
    return this.geonamesId;
  }

  getDate(): string {
    return this.date;
  }

  getWeatherParameters(): WeatherParameter[] {
    return this.weatherParameters;
  }

  getOffset(): number {
    return this.offset;
  }
}

export class WeatherParameter {
  private id: string;
  private minValue: number;
  private maxValue: number;
  private avgValue: number;
  private cumulValue: number;

  constructor(obj) {
    this.id = obj && obj.id || '';
    this.minValue = obj && obj.minValue || null;
    this.maxValue = obj && obj.maxValue || null;
    this.avgValue = obj && obj.avgValue || null;
    this.cumulValue = obj && obj.cumulValue || null;
  }

  getId(): string {
    return this.id;
  }

  getMinValue(): number {
    return this.minValue;
  }

  getMaxValue(): number {
    return this.maxValue;
  }

  getAvgValue(): number {
    return this.avgValue;
  }

  getCumulValue(): number {
    return this.cumulValue;
  }

  get(aggregation: string): number {
    switch (aggregation) {
      case 'avg': {
        return this.avgValue;
      }
      case 'min': {
        return this.minValue;
      }
      case 'max': {
        return this.maxValue;
      }
      case 'cumul': {
        return this.cumulValue;
      }
      default: {
        return null;
      }
    }
  }

}

export class EventConfigurator {
  private readDatesFromCol: string;
  private date: string;
  private readPlacesFromCol: string;
  private places: string[];
  private readCategoriesFromCol: string;
  private categories: string[];

  constructor(obj: any) {
    this.readDatesFromCol = obj && obj.readDatesFromCol || '';
    this.date = obj && obj.date || '';
    this.readPlacesFromCol = obj && obj.readPlacesFromCol || '';
    this.places = obj && obj.places || [];
    this.readCategoriesFromCol = obj && obj.readCategoriesFromCol || '';
    this.categories = obj && obj.categories || [];
  }

  getReadDatesFromCol(): string {
    return this.readDatesFromCol;
  }

  getDate(): string {
    return this.date;
  }

  getReadPlacesFromCol(): string {
    return this.readPlacesFromCol;
  }

  getPlaces(): string[] {
    return this.places;
  }

  getReadCategoriesFromCol(): string {
    return this.readCategoriesFromCol;
  }

  getCategories(): string[] {
    return this.categories;
  }
}

export class Event {
  private geonamesId: string;
  private eventDate: string;
  private categories: string[];
  private eventsCount: number;

  constructor(obj: any) {
    this.geonamesId = obj && obj.geonamesId || '';
    this.eventDate = obj && obj.eventDate || '';
    this.categories = obj && obj.categories || [];
    this.eventsCount = obj && obj.eventsCount || 0;
  }

  getGeonamesId(): string {
    return this.geonamesId;
  }

  getEventDate(): string {
    return this.eventDate;
  }

  getCategories(): string[] {
    return this.categories;
  }

  getEventsCount(): number {
    return this.eventsCount;
  }

}
