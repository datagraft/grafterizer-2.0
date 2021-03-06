import { Injectable, OnChanges } from '@angular/core';
import { Http, Response, RequestOptions, Headers } from '@angular/http';
import { Observable } from 'rxjs';
import { Subscription } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import 'rxjs/add/operator/map';
import { AppConfig } from './app.config';
import * as transformationDataModel from 'assets/transformationdatamodel.js';
import * as jsedn from 'jsedn';

@Injectable()
export class TransformationService {

  private dispatchPath: string;
  private graftwerkCachePath: string;

  public previewedTransformationObjSource: BehaviorSubject<any>;

  public transformationObjSource: BehaviorSubject<any>;

  public graftwerkDataSource: BehaviorSubject<any>;

  public transformationMetadata: BehaviorSubject<any>;

  constructor(private http: Http, private config: AppConfig) {
    // We use the Dispatch service as a proxy to Graftwerk
    this.dispatchPath = this.config.getConfig('dispatch-path');
    // Caching service for Graftwerk - caches intermediate results of transformations
    this.graftwerkCachePath = this.config.getConfig('graftwerk-cache-path');
    const emptyTransformation = new transformationDataModel.Transformation([], [], [new transformationDataModel.Pipeline([])], [new transformationDataModel.Graph("http://example.com/", []), new transformationDataModel.Graph("http://example.com/", [])], []);
    this.transformationObjSource = new BehaviorSubject<any>(emptyTransformation);
    this.previewedTransformationObjSource = new BehaviorSubject<any>(emptyTransformation);
    this.graftwerkDataSource = new BehaviorSubject<any>({
      ':column-names': [],
      ':rows': []
    });
    this.transformationMetadata = new BehaviorSubject<any>({});
  }

  public fillDataGraftWizard(filestoreID: string, transformationID: string, wizardID: string, transformationType): Promise<any> {
    const url = this.dispatchPath + '/fillWizard';
    const options = new RequestOptions({ withCredentials: true });
    const requestPayload = {
      distribution: filestoreID,
      transformation: transformationID,
      wizardId: wizardID,
      type: transformationType
    };
    return this.http.post(url, requestPayload, options)
      .map(result => result.json())
      .toPromise();
  }

  // DO NOT USE - doesn't work for now
  private fillRdfRepo(filestoreID: string, transformationID: string, repoAccessUrl: string): Promise<any> {
    const url = this.dispatchPath + '/fillRDFrepo';
    const options = new RequestOptions({ withCredentials: true });
    const requestPayload = {
      distribution: filestoreID,
      transformation: transformationID,
      queriabledatastore: repoAccessUrl,
      ontotext: true
    };
    return this.http.post(url, requestPayload, options)
      .map(response => response.json())
      .toPromise();
  }

  public getOriginalData(filestoreID: string, page?: number, pageSize?: number): Promise<any> {
    const url = this.dispatchPath + '/preview_original/' + encodeURIComponent(filestoreID);
    const params = {
      page: page || 0,
      pageSize: pageSize || 600,
      useCache: 1
    };
    const options = new RequestOptions({ withCredentials: true, params: params });
    return this.http.get(url, options)
      .map(
        (response: Response) => {
          return response.json();
        })
      .toPromise()
      .then(
        (dispatchResponse) => {
          return this.pollCacheService(dispatchResponse.hash, 'pipe');
        },
        (error) => this.errorHandler(error));
  }

  public previewTransformation(filestoreID: string, clojure: string, page?: number, pageSize?: number): Promise<any> {
    const url = this.dispatchPath + '/preview/' + encodeURIComponent(filestoreID);
    const requestPayload = {
      clojure: clojure,
      useCache: true
    };
    const params = {
      page: page || 0,
      pageSize: pageSize || 600
    };
    const options = new RequestOptions({ withCredentials: true, params: params });
    return this.http.post(url, requestPayload, options)
      .map((response: Response) => response.json())
      .toPromise()
      .then(
        (dispatchResponse) => {
          return this.pollCacheService(dispatchResponse.hash, 'pipe');
        },
        (error) => this.errorHandler(error));
  }

  public getTransformationLink(filestoreID: string, transformationID: string, transformationType: string, rdfFormat?: string): string {
    return this.dispatchPath
      + '/transform/'
      + encodeURIComponent(filestoreID)
      + '/'
      + encodeURIComponent(transformationID)
      + '?type=' + encodeURIComponent(transformationType)
      + (rdfFormat ? '&rdfFormat=' + encodeURIComponent(rdfFormat) : '');
  }

  public transformFile(filestoreID: string, transformationID: string, transformationType: string, rdfFormat?: string): Promise<any> {
    const url = this.getTransformationLink(filestoreID, transformationID, transformationType, rdfFormat) + '&useCache=1';
    const cacheUrl = this.graftwerkCachePath + '/graftermemcache/';
    const options = new RequestOptions({ withCredentials: true });
    return this.http
      .get(url, options)
      .map((response) => response.json())
      .toPromise()
      .then(
        (dispatchResponse) => {
          return this.pollCacheService(dispatchResponse.hash, transformationType);
        },
        (error) => this.errorHandler(error)
      );
  }

  private pollCacheService(hash: string, transformationType: string): Promise<any> {
    const statusUrl = this.graftwerkCachePath + '/graftermemcache/' + hash + '?status=1';
    const resultUrl = this.graftwerkCachePath + '/graftermemcache/' + hash;
    const options = new RequestOptions({ withCredentials: true });

    return new Promise((resolve, reject) => {
      const sub = Observable.interval(2000).startWith(1)
        .mergeMap(() => this.http.get(statusUrl, options))
        .map((response) => response.json())
        .subscribe((response) => {
          // null safety first
          if (response) {
            if (!response.processing) {
              sub.unsubscribe();
              this.http.get(resultUrl, options)
                .map((responseCache) => {
                  // if transformation is a pipe (pipeline), then we parse the response using JSEDN
                  if (transformationType === 'pipe') {
                    return jsedn.toJS(jsedn.parse(responseCache.text()));
                  } else {
                    // if transformation is a graft (or undefined), we pass the response as plain text
                    // to download a csv file after the transformation has been applied, we pass the response as plain text
                    return responseCache.text();
                  }
                })
                .toPromise()
                .then(
                  (transformationResult) => {
                    resolve(transformationResult);
                  },
                  (error) => reject(error));
            }
          }
        })
    });
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
