import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AppConfig } from './app.config';
import { DispatchService } from './dispatch.service';
import { TransformationService } from './transformation.service';
import { DataGraftMessageService } from './data-graft-message.service';

import * as transformationDataModel from '../assets/transformationdatamodel.js';
import * as generateClojure from '../assets/generateclojure.js';
import * as data from '../assets/data.json';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [DispatchService, TransformationService, DataGraftMessageService]
})
export class AppComponent {

  private basic = true;

  constructor(public router: Router, private config: AppConfig, public dispatch: DispatchService, public transformationSvc: TransformationService, public messageSvc: DataGraftMessageService) {
    console.log(config.getConfig('jarfter-path'));
    console.log(config.getConfig('dispatch-path'));
    console.log(config.getConfig('graftwerk-cache-path'));
  }

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

  transformData() {
    const transformationID = 'patients-data';
    const filestoreID = 'patients-csv';
    const transformationType = 'pipe';

    this.transformationSvc.transformFile(filestoreID, transformationID, 'pipe')
      .then(
      (result) => {
        console.log("Successfully transformed (PIPELINE)!");
        console.log(result);
      },
      (error) => console.log(error));

    // Transform (pipe and graft) and store result in a DB
    this.transformationSvc.transformFile(filestoreID, transformationID, 'graft', 'nt')
      .then(
      (result) => {
        console.log("Successfully transformed (GRAFT)!");
      },
      (error) => console.log(error));

    // preview transformation that is saved on DataGraft
    let publisher = 'nvnikolov';
    let existingTransformationID = 'patients-data';
    this.dispatch.getTransformationJson(existingTransformationID, publisher)
      .then(
      (result) => {
        console.log("Got transformation JSON");
        const clojure = generateClojure.fromTransformation(transformationDataModel.Transformation.revive(result));
        console.log("Generated Clojure!");
        this.transformationSvc.previewTransformation(filestoreID, clojure)
          .then(
          (result) => {
            console.log("Successfully previewed transformation!");
            //            console.log(result);
          },
          (error) => console.log("Error previewing transformation!"));
      },
      error => console.log(error));

    // get original data of a distribution
    this.transformationSvc.getOriginalData(filestoreID)
      .then(
      (result) => {
        console.log("Successfully obtained original filestore!");
        console.log(result);
      },
      (error) => console.log("Error obtaining original file!"))

  }

}
