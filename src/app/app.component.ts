import { Component } from '@angular/core';
import { Router } from '@angular/router';

import * as data from '../assets/data.json';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: []
})
export class AppComponent {

  constructor(public router: Router) { }

  /*   generateClojure() {
      console.log("Makedataset function:");
      console.log(this.tester());
      console.log("Generate clojure code:");
      console.log(generateClojure.fromTransformation(transformationDataModel.Transformation.revive(data)));
      console.log("transformationDataModel.Transformation.revive:");
      console.log(transformationDataModel.Transformation.revive(data));
    }; */
}
