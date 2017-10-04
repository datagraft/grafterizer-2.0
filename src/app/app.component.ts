import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AppConfig } from './app.config';
import { DispatchService } from './dispatch.service';

import * as transformationDataModel from '../assets/transformationdatamodel.js';
import * as generateClojure from '../assets/generateclojure.js';
import * as data from '../assets/data.json';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [DispatchService]
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

  getAllTransformations() {
    let publisher = 'nvnikolov';
    let existingTransformationID = 'patients-data';
    this.dispatch.getAllTransformations('', true).then(result => console.log(result), error => console.log(error));
    this.dispatch.getTransformation(publisher, existingTransformationID).then(result => console.log(result), error => console.log(error));

    let someClojure = generateClojure.fromTransformation(transformationDataModel.Transformation.revive(data));
    let newTransformationName = 'test-save-transformation';
    let isPublic = false;
    let newTransformationDescription = 'testing if new transformation request works';
    let newTransformationKeywords = ['one', 'two', 'three'];
    let newTransformationConfiguration = {
      type: 'pipe',
      command: 'my-pipe',
      code: someClojure,
      json: JSON.stringify(data)
    }
    var newTransformationID = '';
    this.dispatch.newTransformation(newTransformationName, isPublic, newTransformationDescription, newTransformationKeywords, newTransformationConfiguration)
      .then(
      (result) => {
        console.log('Created Transformation Success!');
        console.log(result);
        newTransformationID = result.id;
        return this.dispatch.updateTransformation(newTransformationID, publisher, newTransformationName + '-new', !isPublic, newTransformationDescription + ' new', newTransformationKeywords.concat('four'), newTransformationConfiguration).then(
          (result) => {
            console.log("Successfully Updated Transformation!");
            console.log(result);
            let updatedTransformationID = result.id;
            return this.dispatch.getTransformationJson(updatedTransformationID, publisher).then(
              (result) => {
                console.log("Successfully Got Transformation JSON!");
                console.log(result);
                return this.dispatch.forkTransformation(updatedTransformationID, publisher)
                  .then(
                  (result) => {
                    console.log("Successfully Forked Transformation!");
                    console.log(result);
                    let forkedTransformationID = result['id'];
                    return Promise.all([
                      this.dispatch.deleteTransformation(updatedTransformationID, publisher),
                      this.dispatch.deleteTransformation(forkedTransformationID, publisher)
                    ]).then((result) => {
                      console.log("Transformations Deleted!");
                      console.log(result);
                    }, (error) => {
                      console.log("Could not Delete Transformations!");
                      console.log(error);
                    });
                  },
                  (error) => {
                    console.log("Error Forking Transformation!");
                    console.log(error)
                  })
              },
              (error) => { }
            )

          },
          (error) => {
            console.log("Error updating transformation");
            console.log(error);
          })

      },
      (error) => { console.log('Woops!'); console.log(error); }
      );

    this.dispatch.getAllFilestores()
      .then(
      (result) => {
        console.log("Successfully got the user's filestores!");
        console.log(result);
      },
      (error) => {
        console.log("Error getting the user's filestores!");
        console.log(error);
      });
    this.dispatch.getAllSparqlEndpoints()
      .then(
      (result) => {
        console.log("Successfully got the user's SPARQL endpoints!");
        console.log(result);
      },
      (error) => {
        console.log("Error getting user's SPARQL endpoints!");
        console.log(error);
      })
  }

  fileChange(event) {
    let fileList: FileList = event.target.files;
    if (fileList.length > 0) {
      let file: File = fileList[0];
      this.dispatch.uploadFile(file)
        .then(
        (result) => {
          console.log("Successfully uploaded file!");
          console.log(result);
        },
        (error) => {
          console.log("Error uploading file!");
          console.log(error);
        });
    }
  }


  constructor(public router: Router, private config: AppConfig, public dispatch: DispatchService) {
    console.log(config.getConfig('jarfter-path'));
    console.log(config.getConfig('dispatch-path'));
    console.log(config.getConfig('graftwerk-cache-path'));

  }
}
