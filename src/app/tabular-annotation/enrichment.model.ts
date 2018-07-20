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
