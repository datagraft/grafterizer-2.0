import { Injectable } from '@angular/core';
import { Http, Response, RequestOptions, Headers } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import { AppConfig } from './app.config';

// Interface of transformation that is used to serialise responses from DataGraft Fields are self-explanatory...
export interface TransformationMetadata {
  id: string;
  title: string;
  description?: string;
  public: boolean;
  publisher: string;
  modified: Date;
  created: Date;
  keywords?: Array<string>;
}

export interface TransformationConfiguration {
  type: string; // 'pipe' or 'graft'
  command: string; // 'my-pipe' for pipelines or 'my-graft' for RDF transformations
  code: string; // Clojure code for the transformation
  json: string; // JSON serialisation of the transformation object
}

// Interface of filestores that is used to serialise responses from DataGraft. Fields are self-explanatory...
export interface Filestore {
  id: string;
  title: string;
  publisher: string;
  public: boolean;
  created: Date;
  modified: Date;
}

export interface SparqlEndpoint {
  id: string;
  id_num: number;
  title: string;
  publisher: string;
  public: boolean;
  created: Date;
  modified: Date;
}

@Injectable()
export class DispatchService {
  private dispatchPath;

  constructor(private http: Http, private config: AppConfig) {
    this.dispatchPath = this.config.getConfig('dispatch-path');
  }

  public getAllSparqlEndpoints(): Promise<any> {
    const url = `${this.dispatchPath}/myassets/sparql_endpoints`;
    const options = new RequestOptions({ withCredentials: true });

    return this.http
      .get(url, options)
      .map((response: Response) => response.json())
      .toPromise()
      .then(
      (result) => this.mapSparqlEndpoints(result),
      (error) => this.errorHandler(error)
      );
  }

  private mapSparqlEndpoints(result: JSON): Array<SparqlEndpoint> {
    const sparqlEndpoints = [];
    result['dcat:record'].forEach((record) => {
      sparqlEndpoints.push(this.mapSparqlEndpoint(record));
    });
    return sparqlEndpoints;
  }

  private mapSparqlEndpoint(dcatSerialisation: JSON): SparqlEndpoint {
    return {
      id: dcatSerialisation['id'],
      id_num: dcatSerialisation['id_num'],
      title: dcatSerialisation['dct:title'],
      public: dcatSerialisation['dcat:public'],
      publisher: dcatSerialisation['foaf:publisher'],
      modified: new Date(dcatSerialisation['dct:modified']),
      created: new Date(dcatSerialisation['dct:issued'])
    };
  }

  public uploadFile(file: File): Promise<any> {
    const url = `${this.dispatchPath}/myassets/filestores`;
    const options = new RequestOptions({ withCredentials: true });

    const formData: FormData = new FormData();
    formData.append('filestore[name]', 'previewed_dataset_' + file.name);
    formData.append('filestore[description]', 'File uploaded from Grafterizer in preview mode');
    formData.append('filestore[file]', file, file.name);
    return this.http.post(url, formData, options)
      .map(res => res.json())
      .toPromise()
      .then(
      (result: JSON) => result,
      (error) => this.errorHandler(error));
  }

  // Get all filestores from DataGraft
  public getAllFilestores(): Promise<any> {
    const url = `${this.dispatchPath}/myassets/filestores`;
    const options = new RequestOptions({ withCredentials: true });
    return this.http
      .get(url, options)
      .map((response: Response) => response.json())
      .toPromise()
      .then(
      (result) => this.mapFilestores(result),
      (error) => this.errorHandler(error)
      );
  }

  /* Helper method. Maps the response from DataGraft to the Filestore interface (through the Dispatch Service).
  Format of response is as follows (based on DCAT; see https://www.w3.org/TR/vocab-dcat/):
  {
   "@id": <some catalog ID (not used)>,
   "@type": "dcat:Catalog",
  	"@context": {
  		"dcat": "http://www.w3.org/ns/dcat#",
  		"foaf": "http://xmlns.com/foaf/0.1/",
  		"dct": "http://purl.org/dc/terms/",
  		"xsd": "http://www.w3.org/2001/XMLSchema#",
  		"dct:issued": {
  			"@type": "xsd:date"
  		},
  		"dct:modified": {
  			"@type": "xsd:date"
  		},
  		"foaf:primaryTopic": {
  			"@type": "@id"
  		},
  		"dcat:distribution": {
  			"@type": "@id"
  		}
  	},
  	"dcat:record": [{
  		"id": <ID of Filestore>,
  		"type": <Always "Filestore" since that is what we care about (not useful)>,
  		"dct:title": <Name of Filestore>,
  		"foaf:primaryTopic": <URL of Filestore (not useful)>,
  		"@type": <Always "dcat:catalogRecord" (not useful)>,
  		"dcat:public": <true/false depending on if Filestore is public>,
  		"foaf:publisher": <Username of publisher of the Filestore>,
  		"dct:modified": <Date last modified - e.g., "2017-05-30T15:16:04.566Z">,
  		"dct:issued": <Date created - e.g., "2017-05-30T15:15:03.204Z">
  	}
    <zero or more of the same "dcat:record" objects>
     ]
  }
  */
  private mapFilestores(responseJson: JSON): Array<Filestore> {
    const filestores = [];
    responseJson['dcat:record'].forEach((record) => {
      filestores.push(this.mapFilestore(record));
    });
    return filestores;
  }

  /* Helper method. Maps individual filestore records from DataGraft (through the Dispatch Service).
  Format of inputs is expected as follows (based on DCAT; see https://www.w3.org/TR/vocab-dcat/):
  {
  		"id": <ID of Filestore>,
  		"type": <Always "Filestore" since that is what we care about (not useful)>,
  		"dct:title": <Name of Filestore>,
  		"foaf:primaryTopic": <URL of Filestore (not useful)>,
  		"@type": <Always "dcat:catalogRecord" (not useful)>,
  		"dcat:public": <true/false depending on if Filestore is public>,
  		"foaf:publisher": <Username of publisher of the Filestore>,
  		"dct:modified": <Date last modified - e.g., "2017-05-30T15:16:04.566Z">,
  		"dct:issued": <Date created - e.g., "2017-05-30T15:15:03.204Z">
  	}
   */
  private mapFilestore(dcatSerialisation: JSON): Filestore {
    return {
      id: dcatSerialisation['id'],
      title: dcatSerialisation['dct:title'],
      public: dcatSerialisation['dcat:public'],
      publisher: dcatSerialisation['foaf:publisher'],
      modified: new Date(dcatSerialisation['dct:modified']),
      created: new Date(dcatSerialisation['dct:issued'])
    }
  }

  // Fork a transformation
  public forkTransformation(id: string, publisher: string): Promise<any> {
    const url = this.computeTransformationURL(publisher, id) + '/fork';
    const options = new RequestOptions({ withCredentials: true });
    return this.http
      .post(url, {}, options)
      .map((response: Response) => response.json())
      .toPromise()
      .catch((error) => this.errorHandler(error));
  }

  // Get the JSON serialisation of a transformation
  public getTransformationJson(id: string, publisher: string): Promise<any> {
    const url = this.computeTransformationURL(publisher, id) + '/configuration/extra';
    const options = new RequestOptions({ withCredentials: true });
    return this.http
      .get(url, options)
      .map((response: Response) => response.json())
      .toPromise()
      .catch((error) => this.errorHandler(error));
  }
  // Update transformation on DataGraft
  public updateTransformation(id: string, publisher: string, name: string, isPublic: boolean, description: string,
    keywords: Array<string>, configuration: TransformationConfiguration): Promise<any> {
    const url = this.computeTransformationURL(publisher, id);
    const requestPayload = {
      'name': name,
      'public': String(isPublic)
    };
    const options = new RequestOptions({ withCredentials: true });
    // First update the basic information ('name' and 'public')...
    return this.http
      .put(url, requestPayload, options)
      .map((response: Response) => response.json())
      .toPromise()
      .then(
      (result) => {
        // ...then, update metadata and configuration - there may be a new ID for the transformation
        const newId = result['id'];
        const newPublisher = result['foaf:publisher'];
        return Promise.all([
          this.postMetadata(newId, publisher, description, keywords),
          this.postConfiguration(newId, publisher, configuration)
        ]).then(
          () => {
            return Promise.resolve({ id: newId, publisher: newPublisher });
          },
          (error) => this.errorHandler(error))
      },
      (error) => this.errorHandler(error)
      );

  }

  public deleteTransformation(id: string, publisher: string): Promise<any> {
    const url = this.computeTransformationURL(publisher, id);
    const options = new RequestOptions({ withCredentials: true });
    return this.http
      .delete(url, options)
      .map((response: Response) => response)
      .toPromise()
      .then((response) => Promise.resolve({ id: id, publisher: publisher }),
      (error) => this.errorHandler(error));
  }

  // creates Transformation asset in DataGraft, then submits the metadata and configuration
  public newTransformation(name: string, isPublic: boolean, description: string,
    keywords: Array<string>, configuration: TransformationConfiguration): Promise<any> {
    // According to the API, first we create the transformation asset...
    return this.submitTransformation(name, isPublic)
      .then(
      (response: Response) => {
        // ...then, after we get the ID and publisher ID from the response, we add the metadata and configuration
        const id = response['id'];
        const publisher = response['foaf:publisher'];
        return Promise.all([
          this.postMetadata(id, publisher, description, keywords),
          this.postConfiguration(id, publisher, configuration)
        ]).then(
          () => {
            // both metadata and configuration requests pass - we resolve the promise by returning the values
            return Promise.resolve({ id: id, publisher: publisher })
          },
          (error) => this.errorHandler(error)
          )
      }, (error) => this.errorHandler(error)
      );
  }

  // Helper method. Creates Transformation asset in DataGraft and returns a promise
  private submitTransformation(name: string, isPublic: boolean): Promise<any> {
    const url = `${this.dispatchPath}/myassets/transformations`;
    const requestPayload = {
      'name': name,
      'public': String(isPublic)
    };
    const options = new RequestOptions({ withCredentials: true });
    return this.http
      .post(url, requestPayload, options)
      .map((response: Response) => response.json())
      .toPromise();
  }

  //  public updateTransformation(): Promise<any> {
  //
  //  }

  // Helper method. Submits Transformation metadata (description and keywords).
  private postMetadata(id: string, publisher: string, description: string, keywords: Array<string>): Promise<any> {
    const url = this.computeTransformationURL(publisher, id) + '/metadata';
    const requestPayload = {
      'description': description,
      'dcat:keyword': keywords
    };
    const options = new RequestOptions({ withCredentials: true });

    return this.http
      .post(url, requestPayload, options)
      .map((response: Response) => response)
      .toPromise();
  }

  // Helper method. Submits Transformation configuration:
  // type - 'pipe' or 'graft'
  // command - 'my-pipe' or 'my-graft'
  // code - Clojure code
  // json - JSON serialization
  private postConfiguration(id: string, publisher: string, configuration: TransformationConfiguration): Promise<any> {
    const url = this.computeTransformationURL(publisher, id) + '/configuration';
    const options = new RequestOptions({ withCredentials: true });
    // Ugly but necessary for compatibility with legacy transformations - that is the format for old transformations
    const legacyConfig = {
      transformationType: configuration.type,
      transformationCommand: configuration.command,
      code: configuration.code,
      extra: configuration.json
    }
    return this.http
      .post(url, legacyConfig, options)
      .map((response: Response) => response)
      .toPromise();
  }

  // Get a single transformation
  public getTransformation(publisher: string, id: string): Promise<any> {
    const url = this.computeTransformationURL(publisher, id);
    const options = new RequestOptions({ withCredentials: true });
    return this.http
      .get(url, options)
      .map((response: Response) => response.json())
      .toPromise()
      .then((response) => this.mapTransformation(response),
      (error) => this.errorHandler(error));
  }

  // Helper method. Computes the transformation URL
  private computeTransformationURL(publisher: string, id: string): string {
    return `${this.dispatchPath}/${encodeURIComponent(publisher)}/transformations/${encodeURIComponent(id)}`;
  }

  // Get all transformations from DataGraft
  public getAllTransformations(searchInput: string, showPublic: boolean): Promise<any> {
    const params = {
      params: {
        search: searchInput
      }
    };
    const options = new RequestOptions({ params: params, withCredentials: true });
    const url = `${this.dispatchPath}/${showPublic ? 'public_assets' : 'myassets'}/transformations`;
    return this.http
      .get(url, options)
      .map((response: Response) => response.json())
      .toPromise()
      .then((result) => this.mapTransformations(result),
      (error) => this.errorHandler(error));
  }

  /* Helper method. Maps the result of the transformations request from DataGraft (through the Dispatch Service).
  Format of response is as follows (based on DCAT; see https://www.w3.org/TR/vocab-dcat/):
  {
   "@id": <some catalog ID (not used)>,
   "@type": "dcat:Catalog",
  	"@context": {
  		"dcat": "http://www.w3.org/ns/dcat#",
  		"foaf": "http://xmlns.com/foaf/0.1/",
  		"dct": "http://purl.org/dc/terms/",
  		"xsd": "http://www.w3.org/2001/XMLSchema#",
  		"dct:issued": {
  			"@type": "xsd:date"
  		},
  		"dct:modified": {
  			"@type": "xsd:date"
  		},
  		"foaf:primaryTopic": {
  			"@type": "@id"
  		},
  		"dcat:distribution": {
  			"@type": "@id"
  		}
  	},
  	"dcat:record": [{
  		"id": <ID of Transformation>,
  		"type": <Always "Transformation" since that is what we care about (not useful)>,
  		"dct:title": <Name of Transformation>,
  		"foaf:primaryTopic": <URL of transformation (not useful)>,
  		"@type": <Always "dcat:catalogRecord" (not useful)>,
  		"dcat:public": <true/false depending on if transformation is public>,
  		"foaf:publisher": <Username of publisher of the transformation>,
  		"dct:modified": <Date last modified - e.g., "2017-05-30T15:16:04.566Z">,
  		"dct:issued": <Date created - e.g., "2017-05-30T15:15:03.204Z">
  	}
    <zero or more of the same "dcat:record" objects>
     ]
  }
  */
  private mapTransformations(responseJson: JSON): Array<TransformationMetadata> {
    const transformations = [];
    responseJson['dcat:record'].forEach((record) => {
      transformations.push(this.mapTransformation(record));
    });
    return transformations;
  }

  /* Helper method. Maps individual transformation records from DataGraft (through the Dispatch Service).
  Format of inputs is expected as follows (based on DCAT; see https://www.w3.org/TR/vocab-dcat/):
  {
  		"id": <ID of Transformation>,
  		"type": <Always "Transformation" since that is what we care about (not useful)>,
  		"dct:title": <Name of Transformation>,
  		"foaf:primaryTopic": <URL of transformation (not useful)>,
  		"@type": <Always "dcat:catalogRecord" (not useful)>,
  		"dcat:public": <true/false depending on if transformation is public>,
  		"foaf:publisher": <Username of publisher of the transformation>,
  		"dct:modified": <Date last modified - e.g., "2017-05-30T15:16:04.566Z">,
  		"dct:issued": <Date created - e.g., "2017-05-30T15:15:03.204Z">
  	}
   */
  private mapTransformation(dcatSerialisation: JSON): TransformationMetadata {
    return {
      id: dcatSerialisation['id'],
      title: dcatSerialisation['dct:title'],
      description: dcatSerialisation['dct:description'],
      public: dcatSerialisation['dcat:public'],
      publisher: dcatSerialisation['foaf:publisher'],
      modified: new Date(dcatSerialisation['dct:modified']),
      created: new Date(dcatSerialisation['dct:issued']),
      keywords: dcatSerialisation['dcat:keyword']
    }
  }

  // Handles errors thrown from requests from resources to the Dispatch Service
  private errorHandler(error: any) {
    let message = '';
    if (error._body && error._body.error) {
      if (typeof error._body.error === 'string') {
        message = 'API error: ' + error._body.error;
      } else {
        message = 'API error: ' + JSON.stringify(error._body.error);
      }
    } else if (error.status) {
      if (error.status === 401 || error.status === 403 || error.status < 100) {
        // if Forbidden, then begin OAuth flow
        window.location.href = `${this.dispatchPath}/oauth/begin`;
        return Promise.resolve('Beginning OAuth Flow');
      } else {
        message = 'Error ' + error.status + ' while contacting server';
      }
    } else {
      message = 'An error occured when contacting server';
    }
    return Promise.reject(message);

    /* TODO: what do we do in case of errors??

        $mdToast.show(
          $mdToast.simple()
          .content(message)
          .position('bottom left')
          .hideDelay(3000)
        );*/

  }

}
