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
    this.score = obj['score'];
    this.match = obj['match'];
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

  public setResultsFromService(res) {
    Object.keys(res).forEach(key => this.properties.set(key, res[key]));
  }

}

export class DeriveMap {
  private deriveMap: {};
  public newColName: string;

  constructor(newColName: string) {
    this.deriveMap = {};
    this.newColName = newColName;
  }

  buildFromMapping(mapping: Mapping[]) {
    this.deriveMap = {};
    mapping.forEach(m => {
      if (m.results.length > 0) {
        // const key = m.originalQuery.replace(/\s/g, '_');
        this.deriveMap[m.originalQuery] = m.results[0].id; // TODO: iterate over results!
      }
    });
    return this;
  }

  buildFromExtension(selectedProperty: string, extensions: Extension[]) {
    console.log(extensions);
    console.log(selectedProperty);
    this.deriveMap = {};
    extensions.forEach(e => {
      if (e.properties.get(selectedProperty).length > 0) {
        const firstRes = e.properties.get(selectedProperty)[0];
        if (firstRes['name']) {
          this.deriveMap[e.id] = firstRes['name'];
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
    console.log(map);
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