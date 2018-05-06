import { Injectable } from '@angular/core';
import { Http, Response, RequestOptions, Headers } from '@angular/http';
import { AppConfig } from '../app.config';
import { TransformationService } from '../transformation.service';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import * as transformationDataModel from 'assets/transformationdatamodel.js';

export interface Vocabulary {
  name: string;
  namespace: string;
  properties?: Array<string>;
  classes?: Array<string>;
}

@Injectable()
export class RdfVocabularyService {
  private transformationSubscription: Subscription;
  private transformationObj: any;
  private vocabSvcPath: string;
  // Default vocabularies maintained by the vocabulary service
  public defaultVocabularies: Map<string, Vocabulary>;
  public transformationVocabularies: Map<string, Vocabulary>;

  private allRdfVocabSource: BehaviorSubject<any>;
  public allRdfVocabObservable: Observable<any>;

  constructor(private http: Http, private config: AppConfig, private transformationSvc: TransformationService) {
    this.vocabSvcPath = this.config.getConfig('vocabulary-service-path');
    this.defaultVocabularies = new Map<string, Vocabulary>();
    this.transformationVocabularies = new Map<string, Vocabulary>();
    this.allRdfVocabSource = new BehaviorSubject<any>({
      defaultVocabs: Array.from(this.defaultVocabularies.values()),
      transformationVocabs: Array.from(this.transformationVocabularies.values())
    });
    this.allRdfVocabObservable = this.allRdfVocabSource.asObservable();
    // load the default vocabularies from the server
    this.getDefaultVocabs().then((result) => {
      const vocabs = this.mapVocabularies(result);
      for (let i = 0; i < vocabs.length; ++i) {
        let vocab = vocabs[i];
        // duct-tape solution to a bug in the Vocabulary service with a wrongly defined namespace 'sioc'
        const name_space = vocab.namespace === 'http://rdfs.org/sioc/ns#' ? 'http://rdfs.org/sioc/ns' : vocab.namespace;
        this.getVocabularyClassesAndProperties(vocab.name, name_space)
          .then(
            (classAndProps) => {
              // add classes and properties to the vocabulary
              const classes = [];
              const properties = [];
              for (let j = 0; j < classAndProps['classResult'].length; ++j) {
                let classResult = classAndProps['classResult'][j];
                if (classResult.value !== 'null') {
                  classes.push(classResult.value);
                }
              }

              for (let k = 0; k < classAndProps['propertyResult'].length; ++k) {
                let propertyResult = classAndProps['propertyResult'][k];
                if (propertyResult.value !== 'null') {
                  properties.push(propertyResult.value);
                }
              }

              vocab.classes = classes;
              vocab.properties = properties;
              this.defaultVocabularies.set(vocab.name, vocab);
              this.updateVocabs();
            },
            (error) => this.errorHandler(error)
          );
      }
      this.transformationSubscription = this.transformationSvc.currentTransformationObj.subscribe((transformation) => {
        this.transformationVocabularies = new Map<string, Vocabulary>();

        this.transformationObj = transformation;
        transformation.rdfVocabs.forEach((rdfVocab) => {
          if (!rdfVocab.fromServer && !this.defaultVocabularies.get(rdfVocab.name)) {
            this.transformationVocabularies.set(rdfVocab.name, {
              name: rdfVocab.name,
              namespace: rdfVocab.namespace,
              properties: rdfVocab.properties,
              classes: rdfVocab.classes
            });

          }
        });
        this.updateVocabs();
      });
    },
      (error) => this.errorHandler(error)
    );
  }

  private updateVocabs() {
    this.allRdfVocabSource.next({
      defaultVocabs: Array.from(this.defaultVocabularies.values()),
      transformationVocabs: Array.from(this.transformationVocabularies.values())
    });
  }

  /**
   * Saves the currently declared vocabularies in the transformation object
   */
  public saveVocabsToTransformation() {
    let defaultVocabsArray = Array.from(this.defaultVocabularies.values());
    let transformationVocabsArray = Array.from(this.transformationVocabularies.values());
    let newRdfVocabsArray = [];
    // Add all default vocabularies
    for (let i = 0; i < defaultVocabsArray.length; ++i) {
      let newDefaultVocab = new transformationDataModel.RDFVocabulary(defaultVocabsArray[i].name, defaultVocabsArray[i].namespace, defaultVocabsArray[i].properties, defaultVocabsArray[i].classes);
      // All default vocabs are marked using the 'fromServer' property
      newDefaultVocab.fromServer = true;
      newRdfVocabsArray.push(newDefaultVocab);
    }
    // Add all transformation vocabularies
    for (let i = 0; i < transformationVocabsArray.length; ++i) {
      let newTransformationVocab = new transformationDataModel.RDFVocabulary(transformationVocabsArray[i].name, transformationVocabsArray[i].namespace, transformationVocabsArray[i].properties, transformationVocabsArray[i].classes);
      newRdfVocabsArray.push(newTransformationVocab);
    }

    this.transformationObj.rdfVocabs = newRdfVocabsArray;
    this.transformationSvc.changeTransformationObj(this.transformationObj);
  }

  /**
   * Get all default vocabulary definitions from the vocabulary service
   */
  private getDefaultVocabs(): Promise<any> {
    return this.http
      .get(this.vocabSvcPath + '/getAll')
      .map((response: Response) => response.json())
      .toPromise();
  }
  // 
  // The format of the server response is as follows:

  /**
   * Helper method. Maps the server vocabulary descriptions to the internal Vocabulary interface.
   * {
   *  "Message": "Get Vocabulary successfully",
   *  "result": [{
   *    "name": <name (i.e., prefix) of the vocabulary>,
   *    "namespace": <namespace URI of the vocabulary>
   *   }, [... more objects in the same format]
   *  ]
   * }
   * @param  {JSON} vocabularies
   */
  private mapVocabularies(vocabularies: JSON): Array<Vocabulary> {
    const mappedVocabs = [];
    vocabularies['result'].forEach((record) => {
      // duct-tape solution to a bug in the Vocabulary service with a wrongly defined namespace 'sioc'
      const name_space = record['namespace'] === 'http://rdfs.org/sioc/ns' ? 'http://rdfs.org/sioc/ns#' : record['namespace'];
      const vocab = {
        name: record['name'],
        namespace: name_space
      }
      mappedVocabs.push(vocab);
    });
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
      .toPromise();
  }

  /**
   * @param  {string} name prefix name for the vocabulary
   * @param  {string} namespace namespace URI of the vocabulary
   * @param  {string} fileName file name
   * @param  {string} data file content
   * @returns Promise
   */
  public getClassesAndPropertiesFromVocabularyFile(name: string, namespace: string, fileName: string, data: string): Promise<any> {
    const body = JSON.stringify({
      name: name,
      namespace: namespace,
      path: fileName,
      data: data,
      islocal: true
    });
    const headers = new Headers({ 'Content-Type': 'application/json' });
    const options = new RequestOptions({ headers: headers });
    return this.http.post(this.vocabSvcPath + '/getClassAndPropertyFromVocabulary', body, options)
      .map((response: Response) => response.json())
      .toPromise();
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
