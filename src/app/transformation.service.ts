import { Injectable, OnChanges } from '@angular/core';
import { Http, Response, RequestOptions, Headers } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import 'rxjs/add/operator/map';
import { AppConfig } from './app.config';
import * as transformationDataModel from 'assets/transformationdatamodel.js';
import * as jsedn from 'jsedn';

@Injectable()
export class TransformationService {

  private dispatchPath: string;
  private graftwerkCachePath: string;
  // GLOBAL TRANSFORMATION OBJECT
//  private transformationObj: any;
//  private graftwerkData: any;

  private previewedTransformationObjSource: BehaviorSubject<any>;
  public currentPreviewedTransformationObj: Observable<any>;

  private transformationObjSource: BehaviorSubject<any>;
  public currentTransformationObj: Observable<any>;

  private graftwerkDataSource: BehaviorSubject<any>;
  public currentGraftwerkData: Observable<any>;

  public changePreviewedTransformationObj(message: any) {
    this.previewedTransformationObjSource.next(message);
  }

  public changeTransformationObj(message: any) {
    this.transformationObjSource.next(message);
  }

  public changeGraftwerkData(message: any) {
    this.graftwerkDataSource.next(message);
  }

  constructor(private http: Http, private config: AppConfig) {
    // We use the Dispatch service as a proxy to Graftwerk
    this.dispatchPath = this.config.getConfig('dispatch-path');
    // Caching service for Graftwerk - caches intermediate results of transformations
    this.graftwerkCachePath = this.config.getConfig('graftwerk-cache-path');
    const emptyTransformation = new transformationDataModel.Transformation();
    this.transformationObjSource = new BehaviorSubject<any>(emptyTransformation);
    this.graftwerkDataSource = new BehaviorSubject<any>({
      ':column-names': [],
      ':rows': []
    });
    this.previewedTransformationObjSource = new BehaviorSubject<any>(emptyTransformation);
    this.currentTransformationObj = this.transformationObjSource.asObservable();
    this.currentGraftwerkData = this.graftwerkDataSource.asObservable();
    this.currentPreviewedTransformationObj = this.previewedTransformationObjSource.asObservable();
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

    const obs = new Observable(observer => {
      observer.next();
    })
      .switchMap(() => this.http.get(statusUrl, options))
      .map((response) => response.json());
    return new Promise((resolve, reject) => {
      const sub = obs.subscribe(
        (result) => {
          if (!result.processing) {
            sub.unsubscribe();
            this.http.get(resultUrl, options)
              .map((responseCache) => {
                // if transformation is a pipe (pipeline), then we parse the response using JSEDN
                if (transformationType === 'pipe') {
                  return jsedn.toJS(jsedn.parse(responseCache.text()));
                } else {
                  // if transformation is a graft (or undefined), we pass the response as plain text
                  return responseCache;
                }
              })
              .toPromise()
              .then(
                (transformationResult) => {
                  resolve(transformationResult);
                },
                (error) => reject(error));
          }
        },
        (error) => {
          return reject(error);
        });
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
