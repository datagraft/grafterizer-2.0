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

export class DeriveMap {
  private deriveMap: Map<string, string>;
  public newColName: string;

  constructor(newColName: string) {
    this.deriveMap = new Map();
    this.newColName = newColName;
  }

  buildFromMapping(mapping: Mapping[]) {
    this.deriveMap = new Map();
    mapping.forEach(m => {
      if (m.results.length > 0) {
        const key = m.originalQuery.replace(/\s/g, '_');
        this.deriveMap.set(key, m.results[0].id); // TODO: iterate over results!
      }
    });
    return this;
  }

  /**
   * Return the mapping as Clojure map -> {:key1 value1 :key2 value2 ... :keyN valueN}
   * All whitespaces in key values are replaced with underscores
   * @returns {string}
   */
  toClojureMap(): string {
    let map = '{';
    this.deriveMap.forEach((value, key) => {
      map += `:${key} "${value}" `;
    });
    map += '}';
    console.log(map);
    return map;
  }

}
