export class Type {
  public id: string;
  public name: string;

  constructor(obj: Object) {
    this.id = obj['id'];
    this.name = obj['name'];
  }
}

export class Result {
  public id: string;
  public name: string;
  public types: Type[] = [];
  public score: number;
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

export class Mapping {
  public queryId: string;
  public originalQuery: string;
  public results: Result[];

  constructor(queryId: number, query: string) {
    this.queryId = 'q' + queryId;
    this.originalQuery = query;
    this.results = [];
  }

  public getServiceQuery(): string {
    return '"' + this.queryId + '": {"query": "' + this.originalQuery + '"}';
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

  constructor(newColName: string) {
    this.deriveMap = {};
    this.newColTypes = [];
    this.newColName = newColName;
  }

  buildFromMapping(mapping: Mapping[], threshold: number, types: Type[]) {
    this.deriveMap = {};
    this.newColTypes = types;
    mapping.forEach(m => {
      if (m.results.length > 0 && m.results[0].match) {
        this.deriveMap[m.originalQuery] = m.results[0].id; // TODO: iterate over results!
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

  constructor(obj: any) {
    this.parameters = obj && obj.parameters || [];
    this.aggregators = obj && obj.aggregators || [];
    this.offsets = obj && obj.offsets || [];
    this.readDatesFromCol = obj && obj.readDatesFromCol || '';
    this.date = obj && obj.date || '';
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
}

export class WeatherObservation {
  private geonamesId: string;

  private validTime: string;
  private validityDateTime: string;
  private weatherParameters: WeatherParameter[] = [];
  private offset: number;

  constructor(obj) {
    this.geonamesId = obj && obj.geonamesId || '';
    this.validTime = obj && obj.validTime || '';
    this.validityDateTime = obj && obj.validityDateTime || '';
    const tempParam = obj['weatherParameters'];
    for (let i = 0; i < tempParam.length; ++i) {
      this.weatherParameters.push(new WeatherParameter(tempParam[i]));
    }
    this.offset = obj && obj.offset || 0;
  }

  getGeonamesId(): string {
    return this.geonamesId;
  }

  getValidTime(): string {
    return this.validTime;
  }

  getValidityDateTime(): string {
    return this.validityDateTime;
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
  private value: string;

  constructor(obj) {
    this.id = obj && obj.id || '';
    this.value = obj && obj.value || '';
  }

  getId(): string {
    return this.id;
  }

  getValue(): string {
    return this.value;
  }
}
