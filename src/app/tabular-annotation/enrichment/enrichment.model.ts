import {XSDDatatypes} from '../annotation.model';

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

export enum TypeStrict {
  ANY = 'any',
  ALL = 'all',
  SHOULD = 'should'
}

export interface PropertyValue {
  getProperty(): string;
  getValue(): string;
}

export class Id {
  private readonly id: string;

  constructor(id: string) {
    this.id = id;
  }

  getId(): string {
    return this.id;
  }
}

export class PropertyValueNumber implements PropertyValue {
  private readonly p: string;
  private readonly v: number;

  constructor(property: string, value: number) {
    this.p = property;
    this.v = value;
  }

  getProperty(): string {
    return this.p;
  }

  getValue(): string {
    return this.v.toString();
  }
}

export class PropertyValueString implements PropertyValue {
  private readonly p: string;
  private readonly v: string;

  constructor(property: string, value: string) {
    this.p = property;
    this.v = value;
  }

  getProperty(): string {
    return this.p;
  }

  getValue(): string {
    return this.v;
  }
}

export class PropertyValueId implements PropertyValue {
  private readonly pid: string;
  private readonly v: Id;

  constructor(property: string, value: Id) {
    this.pid = property;
    this.v = value;
  }

  getProperty(): string {
    return this.pid;
  }

  getValue(): string {
    return this.v.getId();
  }
}

export class ReconciliationQuery {
  private query: string;
  private limit: number;
  private type: string; // TODO: allow array of strings
  private type_strict: TypeStrict;
  private properties: PropertyValue[];

  constructor(query, type = null, typeStrict = TypeStrict.ANY, limit = 5, properties = []) {
    this.query = query;
    this.limit = limit;
    this.type = type;
    this.type_strict = typeStrict;
    this.properties = properties;
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

  getType(): string {
    return this.type;
  }

  setType(type: string) {
    this.type = type;
  }

  getTypeStrict(): TypeStrict {
    return this.type_strict;
  }

  setTypeStrict(typeStrict: TypeStrict) {
    this.type_strict = typeStrict;
  }

  getPropertyValues(): PropertyValue[] {
    return this.properties;
  }

  setPropertyValues(properties: PropertyValue[]) {
    this.properties = properties;
  }
}

export class QueryResult {
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

export interface DeriveMap {
  deriveMap;
  fromCols: string[];
  newColName: string;
  newColTypes: Type[];
  withProperty: string;
  newColDatatype: string;

  asClojureDeriveFunction(fName: string, fDescr: string, elseValue: string): string;
}

abstract class DeriveMapImpl<T> implements DeriveMap {
  deriveMap: Map<T, string>;
  fromCols: string[];
  newColName: string;
  newColTypes: Type[];
  withProperty: string;
  newColDatatype: string;

  protected constructor(newColName: string, fromCols: string[], withProperty: string) {
    this.deriveMap = new Map();
    this.fromCols = fromCols;
    this.newColTypes = [];
    this.withProperty = withProperty;
    this.newColName = newColName;
  }

  protected abstract getClojureElements(): {params: string, searchKey: string, map: string, elseFunc: string};

  /**
   * Return the deriveMap as a Clojure function to use in a Derive Column step
   * (defn <fName> "<fDescr>" <params> (get <map> <key> <elseValue>)
   */
  asClojureDeriveFunction(fName: string, fDescr: string, elseValue: string): string {
    const cljObj = this.getClojureElements();
    // TODO: use the elseFunc as elseValue when it will be available as Grafter function
    return `(defn ${fName} "${fDescr}" ${cljObj['params']} (get ${cljObj['map']} ${cljObj['searchKey']} "${elseValue}"))`;
  }

}

export class ReconciliationDeriveMap extends DeriveMapImpl<ReconciliationQuery> {
  deriveMap: Map<ReconciliationQuery, string>;

  constructor(newColName: string, fromCols: string[]) {
    super(newColName, fromCols, null);
  }

  buildFromMapping(mapping: QueryResult[], threshold: number, types: Type[]) {
    this.deriveMap.clear();
    this.newColTypes = types;
    mapping.forEach(m => {
      if (m.results.length > 0 && m.results[0].match) {
        this.deriveMap.set(m.reconciliationQuery, m.results[0].id); // TODO: iterate over results!
      }
    });
    return this;
  }

  /**
   * Return the elements needed for writing the Clojure function
   * Map: {[<q1> <v1.1> <v1.2>] "v1" [<q2> <v2.1> <v2.2>] "v2" ... [<qN> <vN.1> <vN.2>] "vN"}
   * Params: [q x1 x2 ... xN]
   * Key: [<q> <x1> <x2>]
   * ElseFunc: asiaClient("<q>", [{"property" "<p1.1>", "value" "<v1.1>"}, {"property" "p1.2", "value" "v1.2"}], <types>, <threshold>)
   * @returns {params: string, searchKey: string, map: string}
   */
  protected getClojureElements(): { params: string; searchKey: string; map: string; elseFunc: string } {
    const params = ['q'].concat(this.fromCols.map((col, idx) => `v${idx}`));

    let map = '{';
    this.deriveMap.forEach((value: string, key: ReconciliationQuery) => {
      map += `["${[key.getQuery()].concat(key.getPropertyValues().map((p: PropertyValue) => p.getValue())).join('" "')}"] "${value}" `;
    });
    map += '}';

    const searchKey = `[${params.join(' ')}]`;

    const propertiesArray: string[] = this.deriveMap.entries().next().value[0].getPropertyValues().map((p: PropertyValue, idx) => {
      return `{"property" "${p.getProperty()}", "value" v${idx}}`;
    });
    const elseFunc = `asiaClient.reconcile(q, [${propertiesArray.join(', ')}], null, null) `; // TODO test this func when available

    return {params: `[${params.join(' ')}]`, searchKey: searchKey, map: map, elseFunc: elseFunc};
  }

}

export class ExtensionDeriveMap extends DeriveMapImpl<string> {

  deriveMap: Map<string, string>;

  constructor(newColName: string, withProperty: string) {
    super(newColName, [], withProperty);
  }

  buildFromExtension(selectedProperty: string, extensions: Extension[], types: Type[]) {
    this.deriveMap.clear();
    this.newColTypes = types;
    extensions.forEach(e => {
      if (e.properties.has(selectedProperty) && e.properties.get(selectedProperty).length > 0) {
        const firstRes = e.properties.get(selectedProperty)[0];
        if (firstRes['id']) {
          this.deriveMap.set(e.id, firstRes['id']);
        } else if (firstRes['str']) {
          this.deriveMap.set(e.id, firstRes['str']);
          this.newColDatatype = XSDDatatypes.string;
        } else if (firstRes['date']) {
          this.deriveMap.set(e.id, firstRes['date']);
          this.newColDatatype = XSDDatatypes.date;
        } else if (firstRes['float']) {
          this.deriveMap.set(e.id, firstRes['float']);
          this.newColDatatype = XSDDatatypes.float;
        } else if (firstRes['int']) {
          this.deriveMap.set(e.id, firstRes['int']);
          this.newColDatatype = XSDDatatypes.integer;
        } else if (firstRes['bool']) {
          this.deriveMap.set(e.id, firstRes['bool']);
          this.newColDatatype = XSDDatatypes.boolean;
        }
      }
    });
    return this;
  }

  protected getClojureElements(): {params: string, searchKey: string, map: string, elseFunc: string} {
    let map = '{';
    this.deriveMap.forEach((value: string, key: string) => {
      map += `"${key}" "${value}" `;
    });
    map += '}';

    const elseFunc = `asiaClient.extend() `; // TODO complete this func when available

    return {params: '[q]', searchKey: 'q', map: map, elseFunc: elseFunc};
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
