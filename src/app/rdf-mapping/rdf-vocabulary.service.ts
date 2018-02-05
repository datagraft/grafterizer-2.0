import { Injectable } from '@angular/core';
import { Http, Response, RequestOptions, Headers } from '@angular/http';
import { AppConfig } from '../app.config';

export interface Vocabulary {
  name: string;
  namespace: string;
  properties?: Array<string>;
  classes?: Array<string>;
}

@Injectable()
export class RdfVocabularyService {
  private vocabSvcPath: string;
  // Default vocabularies maintained by the vocabulary service
  public defaultVocabularies: Map<string, Vocabulary>;

  // Manually added vocabularies, stored in the transformation object
  public transformationVocabularies: Map<string, Vocabulary>;

  constructor(private http: Http, private config: AppConfig) {
    this.vocabSvcPath = this.config.getConfig('vocabulary-service-path');
    // load the default vocabularies from the server
    this.http
      .get(this.vocabSvcPath + '/getAll')
      .map((response: Response) => response.json())
      .toPromise()
      .then(
      (result) => {
        this.defaultVocabularies = new Map<string, Vocabulary>();
        const vocabs = this.mapVocabularies(result);
        console.log(vocabs);
        console.log(vocabs.length);
        vocabs.forEach((vocab) => {
          this.defaultVocabularies.set(vocab.name, vocab);
          console.log(this.defaultVocabularies);
        });
        console.log(this.defaultVocabularies);
      },
      (error) => this.errorHandler(error)
    );
    //    console.log(this.defaultVocabularies);
    // load the vocabularies from the transformation object
  }

  //  private getDefaultVocabs
  // Helper method. Maps the server vocabulary descriptions to the internal Vocabulary interface.
  // The format of the server response is as follows:
  // {
  //  "Message": "Get Vocabulary successfully",
  //  "result": [{
  //    "name": <name (i.e., prefix) of the vocabulary>,
  //    "namespace": <namespace URI of the vocabulary>
  //  }, [... more objects in the same format]
  //  ]
  // }
  private mapVocabularies(vocabularies: JSON): Array<Vocabulary> {
    const mappedVocabs = [];
//    vocabularies['result'].forEach((record) => {
//      const body = JSON.stringify(
//        {
//          name: record.name,
//          namespace: record.namespace
//        }
//      );
//      const headers = new Headers({ 'Content-Type': 'application/json' });
//      const options = new RequestOptions({ headers: headers });
//      const vocab = this.mapVocabulary({
//          name: record.name,
//          namespace: record.namespace
//        }, {
//          classes: classes,
//          properties: properties
//        });
//      // First, retrieve the classes and properties for each vocabulary
//      mappedVocabs.push(vocab);
//    });
    return mappedVocabs;
  }

  private getVocabularyClassesAndProperties(name: string, name_space: string): Promise<any> {
    const body = JSON.stringify(
        {
          name: name,
          namespace: name_space
        }
      );
      const headers = new Headers({ 'Content-Type': 'application/json' });
      const options = new RequestOptions({ headers: headers });
    return this.http.post(this.vocabSvcPath + '/getClassAndProperty', body, options)
      .map((response: Response) => response.json())
      .toPromise()
      .then(
      (result) => {
        // map each retrieved vocabulary and add it to the array
        const classes = [];
        const properties = [];
        result['classResult'].forEach((classResult) => {
          if (classResult.value !== 'null') {
            classes.push(classResult.value);
          }
        });
        result['propertyResult'].forEach((propertyResult) => {
          if (propertyResult.value !== 'null') {
            properties.push(propertyResult.value);
          }
        });
        // map each vocabulary to the interface Vocabulary and add it to the result array
        
        
      },
      (error) => this.errorHandler(error)
    );
  }

  // Helper method. Maps single vocabulary objects obtained from the vocabulary service.
  // The format of the server response is as follows:
  // {
  //      "message": "get class and property info sucessful",
  //        "classResult": [
  //          {
  //            "value": <class name>
  //          },
  //          [... more objects of the same type]
  //        ],
  //        "propertyResult": [
  //          {
  //            "value": <property name>
  //          },
  //          [... more objects of the same type]
  //        ]
  // }
  private mapVocabulary(vocabulary: any, classesAndProperties: any): Vocabulary {
    return {
      name: vocabulary['name'],
      namespace: vocabulary['namespace'],
      properties: classesAndProperties['properties'] ? classesAndProperties['properties'] : [],
      classes: classesAndProperties['classes'] ? classesAndProperties['classes'] : []
    }
  }

  private errorHandler(error: any) {
    let message = '';
    if (error._body && error._body.error) {
      if (typeof error._body.error === 'string') {
        message = 'API error: ' + error._body.error;
      } else {
        message = 'API error: ' + JSON.stringify(error._body.error);
      }
    } else if (error.status) {
      message = 'Error ' + error.status + ' while contacting server';
    } else {
      message = 'An error occured when contacting server';
    }
    return Promise.reject(message);
  }

}
