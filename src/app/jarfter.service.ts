import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import 'rxjs/add/operator/map';
import { AppConfig } from './app.config';
import { TransformationService } from './transformation.service';

import * as generateClojure from '../assets/generateclojure.js';

@Injectable()
export class JarfterService {

  private jarfterPath;

  constructor(private config: AppConfig, private transformationSvc: TransformationService) {
    this.jarfterPath = this.config.getConfig('jarfter-path');
  }

  getJarCreatorStandAloneEndpoint() {
    return `${this.jarfterPath}/jarfter/webresources/jarCreatorStandAlone`;
    // return this.jarfterPath + '/jarfter/webresources/jarCreatorStandAlone';
  };

  getTransformStandAloneEndpoint() {
    return this.jarfterPath + '/jarfter/webresources/transformStandAlone';
  };

  generateClojure(transformation) {
    // namespace declaration and imports
    var clojure = '(ns grafterizer.transformation\r\n     (:require [grafter.tabular :refer :all]\r\n               [clojure.string :refer [capitalize lower-case upper-case trim trim-newline triml trimr]]\r\n               [tabular_functions.datatypes :as datatypes]\r\n               [tabular_functions.pipeline :as new-tabular]\r\n               [grafter.rdf :refer [prefixer s add]]\r\n               [grafter.rdf.templater :refer [graph]]\r\n\t\t\t      [grafter.rdf.formats :refer :all]\r\n               [grafter.vocabularies.rdf :refer :all]\r\n               [grafter.vocabularies.qb :refer :all]\r\n               [grafter.vocabularies.sdmx-measure :refer :all]\r\n               [grafter.vocabularies.sdmx-attribute :refer :all]\r\n               [grafter.vocabularies.skos :refer :all]\r\n               [grafter.vocabularies.foaf :refer :all]\r\n               [grafter.vocabularies.owl :refer :all]\r\n        [graftwerk.shape.shape-support :refer :all]\r\n\        [grafter.vocabularies.dcterms :refer :all]\r\n\t\t\t      [clj-time.format]\r\n\t\t\t      [grafter.rdf.io :as ses]\r\n\t\t\t      [grafter.tabular.common :refer [read-dataset*]]\r\n\t)\r\n     (:import [gov.nasa.worldwind.geom.coords.UTMCoord]\r\n              [org.openrdf.model.impl.URIImpl]\r\n\t)\r\n\t\r\n)';

    // pipeline and graft
    clojure += generateClojure.fromTransformation(transformation);
    let outGraph = true;
    if (transformation.graphs &&
      transformation.graphs.length !== 0) {
      outGraph = false;
    }
    if (outGraph) {
      // if graft - execute the pipeline and then the graft
      clojure += '\r\n(defn import-data\r\n  [quads-seq destination]\r\n  (add (ses\/rdf-serializer destination) quads-seq)\r\n)\r\n\r\n(defn my-transformation [dataset output]\r\n\r\n  (import-data \r\n    (make-graph (my-pipe dataset))\r\n  output)\r\n)';
    } else {
      // if pipe - execute just pipe
      clojure += '\r\n(defn import-data\r\n  [pipe-result destination]\r\n  (write-dataset destination pipe-result)\r\n)\r\n\r\n(defn my-transformation [dataset output]\r\n\r\n  (import-data \r\n   (my-pipe dataset)\r\n  output)\r\n)';
    }
    return clojure;
  };
}