import { Injectable } from '@angular/core';
import { Http, Response, ResponseContentType } from '@angular/http';
import { AppConfig } from 'app/app.config';

@Injectable()
export class ArangoGeneratorService {
  private arangoServicePath: any;

  constructor(private http: Http, private config: AppConfig) {
    this.arangoServicePath = this.config.getConfig('arango-generator');
  }

  public getArangoCollections(file: Blob, transformationJson: any): Promise<any> {
    const url = `${this.arangoServicePath}/arango_transform/zip`;
    const formData: FormData = new FormData();

    formData.append('file', file, 'input.csv');
    formData.append('mapping', JSON.stringify(transformationJson));
    return this.http
      .post(url, formData, { responseType: ResponseContentType.Blob })
      .map((response: Response) => response.blob())
      .toPromise();
  }
}
