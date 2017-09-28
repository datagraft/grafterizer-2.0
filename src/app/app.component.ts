import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AppConfig } from './app.config';

import * as transformationDataModel from '../assets/transformationdatamodel.js';
import * as generateClojure from '../assets/generateclojure.js';
import * as data from '../assets/data.json';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: []
})
export class AppComponent {

  tester() {
    return new transformationDataModel.MakeDatasetFunction(
      [], true, 0, true, null);
  }

  private title = 'Click to generate clojure';
  private basic = true;
  generateClojure() {
    console.log("Makedataset function:");
    console.log(this.tester());
    console.log("Generate clojure code:");
    console.log(generateClojure.fromTransformation(transformationDataModel.Transformation.revive(data)));
    console.log("transformationDataModel.Transformation.revive:");
    console.log(transformationDataModel.Transformation.revive(data));
  };
  constructor(public router: Router, private config: AppConfig) {
    console.log(config.getConfig('jarfter-path'));
    console.log(config.getConfig('dispatch-path'));
    console.log(config.getConfig('graftwerk-cache-path'));
  }
}
