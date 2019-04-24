import { Component, OnInit, EventEmitter, OnDestroy, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { RdfVocabularyService, Vocabulary } from 'app/rdf-mapping/rdf-vocabulary.service';
import { TransformationService } from 'app/transformation.service';

@Component({
  selector: 'app-rdf-prefix-management-dialog',
  templateUrl: './rdf-prefix-management-dialog.component.html',
  styleUrls: ['./rdf-prefix-management-dialog.component.scss']
})
export class RdfPrefixManagementDialogComponent implements OnInit, OnDestroy {
  private openRdfPrefixManagementDialog = true;

  // Emits an event when we close the dialog so the component can be destroyed
  close = new EventEmitter();

  // Subscription to the RDF vocabulary service for the rdf vocabularies and the arrays that hold the default and transformation vocabs
  private rdfVocabsSubscription: Subscription;
  private defaultVocabs: Array<any>;
  private transformationVocabs: Array<any>;

  // Subscription to the transformation service for the data transformation
  private transformationSubscription: Subscription;
  private transformationObj: any;


  @ViewChild('vocabFile') vocabFileInput: any;

  private isEditVocab = false;
  private vocabToEdit: any;

  private editedVocabPrefixName: string;
  private editedVocabNamespaceURI: string;

  private fileName: string;
  private loadingVocabFile = false;
  private uploadedFileClasses: Array<string> = [];
  private uploadedFileProperties: Array<string> = [];



  constructor(private rdfVocabSvc: RdfVocabularyService, private transformationSvc: TransformationService) { }

  ngOnInit() {
    this.rdfVocabsSubscription = this.rdfVocabSvc.allRdfVocabObservable.subscribe((rdfVocabsObj) => {
      this.defaultVocabs = rdfVocabsObj.defaultVocabs;
      this.transformationVocabs = rdfVocabsObj.transformationVocabs;
    });

    this.transformationSubscription = this.transformationSvc.currentTransformationObj.subscribe((transformation) => {
      this.transformationObj = transformation;
    });
  }

  ngOnDestroy() {

  }

  onClickedExit() {
    this.openRdfPrefixManagementDialog = false;
    this.close.emit('closed dialog');
  }

  /**
   * Retrieves the user-defined vocabulary object for given a prefix name
   * @param  {string} vocabPrefix the prefix for the vocabulary to be retrieved
   * @returns vocabulary object
   */
  private getVocabulary(vocabPrefix: string): any {
    for (let i = 0; i < this.transformationVocabs.length; ++i) {
      if (this.transformationVocabs[i].name == vocabPrefix) {
        return this.transformationVocabs[i];
      }
    }
  }

  /**
   * Handles clicking the 'Done' button
   */
  done() {
    this.onClickedExit();
  }

  /**
   * Handles click on button 'Add new prefix'
   */
  addNewVocabulary() {
    this.resetEditVocab();
    this.isEditVocab = true;
  }

  /**
   * Handles clicking the edit button for vocabularies.
   * @param  {} event the emitted event that triggered the edit
   */
  editVocab(event) {
    // Stop event from propagating so the accordion control does not expand
    event.stopPropagation();

    // Identify the vocabulary that is being edited
    this.vocabToEdit = this.getVocabulary(event.currentTarget.id);

    // In case of shenanigans
    if (!this.vocabToEdit) {
      console.log('ERROR: unexpected event - could not find vocabulary being edited');
      return;
    }

    // Load the prefix and namespace URI
    this.editedVocabPrefixName = this.vocabToEdit.name;
    this.editedVocabNamespaceURI = this.vocabToEdit.namespace;

    this.isEditVocab = true;
  }

  /**
   * Handles clicking the delete button for vocabularies.
   * @param  {} event the emitted event that triggered the deletion
   */
  deleteVocab(event) {
    event.stopPropagation();

    // Identify the vocabulary that is being deleted
    this.vocabToEdit = this.getVocabulary(event.currentTarget.id);

    // Delete the vocabulary
    if (this.vocabToEdit) {
      this.rdfVocabSvc.transformationVocabularies.delete(this.vocabToEdit.name);
    }

    // Apply changes to the transformation
    this.rdfVocabSvc.saveVocabsToTransformation();
  }

  /**
   * Handles the file control for loading a vocabulary
   * @param  {} event the emitted event when a file was chosen
   */
  vocabFileChange(event) {
    this.loadingVocabFile = true;
    const fileList: FileList = event.target.files;
    if (fileList.length > 0) {
      const file: File = fileList[0];
      this.fileName = file.name;
      const fileReader: FileReader = new FileReader();

      let self = this;
      fileReader.onloadend = function (e) {

        let name = 'tmp';
        let namespace = 'http://tmp.com/#';
        // get classes and properties from vocab service
        self.rdfVocabSvc.getClassesAndPropertiesFromVocabularyFile(name, namespace, self.fileName, fileReader.result.toString())
          .then(
            (result) => {
              for (let i = 0; i < result.classResult.length; ++i) {
                self.uploadedFileClasses.push(result.classResult[i].value);
              }
              for (let i = 0; i < result.propertyResult.length; ++i) {
                self.uploadedFileProperties.push(result.propertyResult[i].value);
              }
              // stop loading
              self.loadingVocabFile = false;
            },
            (error) => {
              console.log(error);
              console.log('error');
              // stop loading
              self.loadingVocabFile = false;
              self.resetFileInput();
            })


      }

      fileReader.readAsText(file);
    }
  }

  /**
   * Reset the file input box
   */
  resetFileInput() {
    this.vocabFileInput.nativeElement.value = "";
    this.uploadedFileClasses = [];
    this.uploadedFileProperties = [];
  }

  /**
   * Resets the vocabulary editing 'dialog'
   */
  resetEditVocab() {
    this.isEditVocab = false;
    this.vocabToEdit = null;
    this.editedVocabPrefixName = '';
    this.editedVocabNamespaceURI = '';
    this.fileName = '';
    this.loadingVocabFile = false;
    this.uploadedFileClasses = [];
    this.uploadedFileProperties = [];
  }

  /**
   * Handles clicking the 'Cancel' button when editing vocabularies
   */
  cancelVocabEdit() {
    // Reset the dialog
    this.resetEditVocab();
  }

  /**
   * Handles clicking the 'Edit vocabulary' button when editing vocabularies
   */
  confirmVocabEdit() {
    if (this.vocabToEdit) {
      // When editing existing vocabulary we need to delete the previous entry
      this.rdfVocabSvc.transformationVocabularies.delete(this.vocabToEdit.name);
    }
    // Create and add a new vocabulary with the values from the UI
    let newEntry = {
      name: this.editedVocabPrefixName.trim(),
      namespace: this.editedVocabNamespaceURI.trim(),
      classes: this.uploadedFileClasses,
      properties: this.uploadedFileProperties
    };
    this.rdfVocabSvc.transformationVocabularies.set(this.editedVocabPrefixName.trim(), newEntry);

    // Finally, update transformation object
    this.rdfVocabSvc.saveVocabsToTransformation();

    // Reset the dialog
    this.resetEditVocab();
  }
}
