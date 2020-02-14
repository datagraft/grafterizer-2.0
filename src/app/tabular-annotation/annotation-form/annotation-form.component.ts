import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { AnnotationService } from '../annotation.service';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { ColumnTypes, XSDDatatypes, AnnotationStatuses } from '../annotation.model';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { Observable, Subscription } from 'rxjs';
import { AsiaMasService } from '../asia-mas/asia-mas.service';
import { CustomValidators } from '../shared/custom-validators';
import * as transformationDataModel from 'assets/transformationdatamodel.js';
import { TransformationService } from 'app/transformation.service';

@Component({
  selector: 'app-annotation-form',
  templateUrl: './annotation-form.component.html',
  styleUrls: ['./annotation-form.component.css']
})
export class AnnotationFormComponent implements OnInit, OnDestroy {
  public header: any;

  open = false;
  isSubject = false;
  isObject = false;
  submitted = false;

  public inputAnnotation: any;
  public currentAnnotation: any;
  displayURINamespace = false;
  displayDatatype = false;
  displayType = false;
  displayLangTag = true; // because the default datatype is string
  displayCustomDatatype = false;

  allowedSources: string[];
  availableNamespaces: string[];
  availableColumnValuesTypes = Object.keys(ColumnTypes);
  availableDatatypes = Object.keys(XSDDatatypes);

  private transformationSubscription: Subscription;
  private transformationObj: any;

  annotationForm: FormGroup;

  constructor(private transformationSvc: TransformationService, public annotationService: AnnotationService,
    private suggesterSvc: AsiaMasService,
    public dialogRef: MatDialogRef<AnnotationFormComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogInputData: any) {
  }

  ngOnInit() {
    this.transformationSubscription =
      this.transformationSvc.transformationObjSource.subscribe((transformationObj) => {
        this.transformationObj = transformationObj;
      });

    this.buildForm();


    this.header = this.dialogInputData.header;
    let annotationId = this.dialogInputData.annotationId || 0;
    this.isSubject = false; // not subject

    if (annotationId) {
      // annotation exists; check if it is a subject
      this.transformationObj.annotations.forEach((annotation) => {
        if (annotation.subjectAnnotationId === annotationId) {
          this.isSubject = true;
        }
      });
      this.currentAnnotation = this.transformationObj.getAnnotationById(annotationId);
      this.setFormFromAnnotation();
    } else {
      this.currentAnnotation = new transformationDataModel.Annotation(this.dialogInputData.header, 0, [], 'invalid', this.transformationObj.getUniqueId(), []);
      this.getInitialSuggestionsAsia();
    }


    const namespacesSet = new Set<string>();
    this.transformationObj.rdfVocabs.forEach(vocab => namespacesSet.add(vocab.namespace));
    this.availableNamespaces = Array.from(namespacesSet);

    this.fillAllowedSourcesArray();
    this.onChanges();

  }

  ngOnDestroy() {
    this.transformationSubscription.unsubscribe();
    // Don't save anything since each valid annotation is already stored into the service
  }

  buildForm() {
    this.annotationForm = new FormGroup({
      columnInfo: new FormGroup({
        columnTypes: new FormArray([this.createColType()]),
        columnValuesType: new FormControl('', this.subjectValuesTypeValidator()),
        urifyNamespace: new FormControl(this.annotationService.getUrifyDefault(), CustomValidators.URLValidator()),
        columnDatatype: new FormControl('string'),
        customDatatype: new FormControl('', CustomValidators.URLValidator()),
        langTag: new FormControl('en'),
      }),
      relationship: new FormGroup({
        subject: new FormControl('', CustomValidators.columnValidator(this.allowedSources)),
        property: new FormControl('', CustomValidators.URLValidator()),
      }),
    }, Validators.compose([
      CustomValidators.langTagValidator('columnInfo.columnDatatype', 'columnInfo.langTag'),
      CustomValidators.subjectPropertyValidator('relationship.subject', 'relationship.property', 'columnInfo.columnValuesType'),
      CustomValidators.customDatatypeValidator('columnInfo.columnDatatype', 'columnInfo.customDatatype'),
      CustomValidators.columnTypesValidator('columnInfo.columnTypes', 'columnInfo.columnValuesType'),
      CustomValidators.urifyNamespaceValidator('columnInfo.urifyNamespace', 'columnInfo.columnValuesType'),
    ]
    ));
  }

  createColType(): FormGroup {
    return new FormGroup({
      columnType: new FormControl('', CustomValidators.URLValidator())
    });
  }

  addColType(index: number): void {
    const columnTypes = this.annotationForm.get('columnInfo.columnTypes') as FormArray;
    columnTypes.insert(index + 1, this.createColType());
  }

  deleteColType(index: number): void {
    const columnTypes = this.annotationForm.get('columnInfo.columnTypes') as FormArray;
    columnTypes.removeAt(index);
  }

  setFormFromAnnotation() {
    let subject = this.transformationObj.getAnnotationById(this.currentAnnotation.subjectAnnotationId);
    if (subject) {
      // set name of subject column
      this.annotationForm.get('relationship.subject').setValue(subject.columnName);
    }

    if (this.currentAnnotation.properties.length) {
      // set property name of relation with subject column; NB! - this works only if we have single property annotation
      this.annotationForm.get('relationship.property').setValue(this.transformationObj.getPropertyNodeFullyQualifiedName(this.currentAnnotation.properties[0]));
    }


    // set the type of node (URI node or Literal)
    const annotationType = this.currentAnnotation instanceof transformationDataModel.URINodeAnnotation ? ColumnTypes.URI : ColumnTypes.Literal;
    this.annotationForm.get('columnInfo.columnValuesType').setValue(annotationType);

    if (this.currentAnnotation instanceof transformationDataModel.URINodeAnnotation) {
      // in case of URI node annotation, set the types for the column
      const types = this.currentAnnotation.columnTypes;
      for (let i = 0; i < types.length; ++i) {
        (this.annotationForm.get('columnInfo.columnTypes') as FormArray).controls[i].get('columnType')
          .setValue(this.transformationObj.getConstantURINodeFullyQualifiedName(types[i]));
        this.addColType(i);
      }
      this.annotationForm.get('columnInfo.urifyNamespace').setValue(this.transformationObj.getURIForPrefix(this.currentAnnotation.urifyPrefix));
    } else if (this.currentAnnotation instanceof transformationDataModel.LiteralNodeAnnotation) {
      const annotationDatatype = this.currentAnnotation.columnDatatype;
      let datatype = Object.keys(XSDDatatypes).find(key => XSDDatatypes[key] === annotationDatatype);
      if (!datatype) {
        datatype = 'custom';
      }
      this.annotationForm.get('columnInfo.columnDatatype').setValue(datatype);
      if (datatype === 'custom') {
        this.annotationForm.get('columnInfo.customDatatype').setValue(this.currentAnnotation.columnDatatype);
      }
      if (datatype === 'string') {
        this.annotationForm.get('columnInfo.langTag').setValue(this.currentAnnotation.langTag);
      }
    }
    this.changeValuesType(annotationType); // this method marks the field as dirty
    this.annotationForm.get('columnInfo.columnValuesType').markAsPristine();

    this.isObject = this.currentAnnotation.subjectAnnotationId && this.currentAnnotation.properties.length;
    if (this.annotationForm.get('relationship.subject').invalid) { // check if the subject column exists)
      this.annotationForm.get('relationship.subject').markAsDirty();
      this.submitted = false;
    } else if (this.annotationForm.get('columnInfo.columnValuesType').invalid) { // check if the values type is valid
      this.annotationForm.get('relationship.subject').markAsDirty();
      this.submitted = false;
    } else {
      this.annotationForm.markAsPristine();
      this.submitted = true;
    }
  }

  resetForm() {
    // reset form fields
    this.annotationForm.reset({
      columnInfo: {
        columnType: '',
        columnValuesType: '',
        urifyNamespace: '',
        columnDatatype: 'string',
        customDatatype: '',
        langTag: 'en',
      },
      relationship: {
        subject: '',
        property: '',
      }
    });

    // in case the annotation is a subject, all object annotations must be marked as 'invalid'
    let objectAnnotations = this.transformationObj.getAllObjectAnnotationsForSubject(this.currentAnnotation.id);
    for (let i = 0; i < objectAnnotations.length; ++i) {
      objectAnnotations[i].status = 'invalid';
      objectAnnotations[i].subjectAnnotationId = 0;
    }
    // tentatively remove the annotation from the transformation object; this will be persisted if we submit the form
    this.transformationObj.removeAnnotationById(this.currentAnnotation.id);

    // set the current annotation to null so we do not save it in the transformation if we submit (there is a check for null in the beginning of submission)
    this.currentAnnotation = new transformationDataModel.Annotation('', 0, [], 'invalid', 0, []);


    this.isSubject = false;
    this.isObject = false;
    this.submitted = false;
    this.displayURINamespace = false;
    this.displayDatatype = false;
    this.displayType = false;
    this.displayLangTag = true; // because the default datatype is string
    this.displayCustomDatatype = false;
  }

  /**
   * Reset the annotation model when a submitted form changes
   */
  onChanges(): void {
    this.annotationForm.valueChanges.subscribe(valuesObj => {
      if (this.dialogRef) {
        this.submitted = false;
      }
      // We do not need to listen for the specific change - 
      // we always change after "Annotate" has been clicked (and save the change in the transformation); 
      // if not - we do nothing
    });
  }

  /**
   * A subject column must have URL as values type
   * @returns {boolean} true if this column is a subject and the values type is not URL. false otherwise.
   */
  isValuesTypeNotValid(valuesType: string) {
    return this.isSubject && valuesType !== ColumnTypes.URI;
  }

  subjectValuesTypeValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      if (control.value === '') {
        return { 'invalidColumnValuesType': { errorMessage: 'Column values type is required' }, 'missingColumnValuesType': true };
      }
      if (this.isValuesTypeNotValid(control.value)) {
        return { 'invalidColumnValuesType': { errorMessage: 'A subject column must be of type URI' } };
      }
      return null;
    };
  }

  /**
   * Update form when column values types change
   * @param columnDatatype
   */
  changeValuesType(columnDatatype) {
    const formElement = this.annotationForm.get('columnInfo.columnValuesType');
    formElement.setValue(columnDatatype);
    if (columnDatatype === ColumnTypes.URI) {
      this.displayURINamespace = true;
      this.displayDatatype = false;
      this.displayType = true;
      this.displayCustomDatatype = false;
      if (!(this.currentAnnotation instanceof transformationDataModel.URINodeAnnotation)) {
        this.currentAnnotation = new transformationDataModel.URINodeAnnotation(
          this.currentAnnotation.columnName,
          this.currentAnnotation.subjectAnnotationId,
          this.currentAnnotation.properties,
          [],
          '',
          this.transformationObj.isSubjectAnnotation(this.currentAnnotation),
          this.currentAnnotation.status,
          this.currentAnnotation.id,
          '',
          [],
          null);
      }
    }
    if (columnDatatype === ColumnTypes.Literal) {
      if (this.annotationForm.get('columnInfo.columnDatatype').value === 'custom') {
        this.displayCustomDatatype = true;
      }
      this.displayType = false;
      this.displayURINamespace = false;
      this.displayDatatype = true;
      if (!(this.currentAnnotation instanceof transformationDataModel.LiteralNodeAnnotation)) {
        this.currentAnnotation = new transformationDataModel.LiteralNodeAnnotation(
          this.currentAnnotation.columnName,
          this.currentAnnotation.subjectAnnotationId,
          this.currentAnnotation.properties,
          '',
          '',
          this.currentAnnotation.status,
          this.currentAnnotation.id,
          this.currentAnnotation.extensions);
      }
    }
    formElement.markAsDirty();
  }

  /**
   * Update form when column datatype changes
   * @param datatype
   */
  changeDatatype(datatype) {
    const formElement = this.annotationForm.get('columnInfo.columnDatatype');
    formElement.setValue(datatype);
    this.displayLangTag = (datatype === 'string');
    this.displayCustomDatatype = (datatype === 'custom');
    formElement.markAsDirty();
  }

  /**
   * Set the value for the formElemement sourceColumn (it cannot be done automatically)
   * TODO: remove this method when Clarity will expose the autocomplete functionality
   * @param sourceColValue
   */
  changeSourceColumn(sourceColValue) {
    const formElement = this.annotationForm.get('relationship.subject');
    formElement.setValue(sourceColValue);
    formElement.markAsDirty();
  }

  /**
   * Set the value for the formElemement urifyNamespace (it cannot be done automatically)
   * TODO: remove this method when Clarity will expose the autocomplete functionality
   * @param namespaceValue
   */
  changeUrifyNamespace(namespaceValue) {
    const formElement = this.annotationForm.get('columnInfo.urifyNamespace');
    formElement.setValue(namespaceValue);
    formElement.markAsDirty();
  }

  /**
   * Close dialog without saving changes
   */
  closeWithoutSaving() {
    // this.resetForm();
  }

  /**
   * Apply changes to the annotation model when the form is submitted
   */
  onSubmit() {
    // if annotation has not been set to null - we are saving
    if (this.currentAnnotation.id) {
      const valuesType = this.annotationForm.get('columnInfo.columnValuesType').value;
      if (valuesType === ColumnTypes.Literal) {
        this.currentAnnotation = new transformationDataModel.LiteralNodeAnnotation('', 0, [], '', '', 'valid', this.currentAnnotation.id, this.currentAnnotation.extensions);
      } else if (valuesType === ColumnTypes.URI) {
        // we keep the conciliator service name, extensions and reconciliations for URI node annotations
        this.currentAnnotation = new transformationDataModel.URINodeAnnotation('', 0, [], [], '', false, 'valid', this.currentAnnotation.id, this.currentAnnotation.conciliatorServieName, this.currentAnnotation.extensions, this.currentAnnotation.reconciliation);
        // change status of all object annotations from 'warning' (indicating subject has not been correctly annotated) to 'valid'
        let objectAnnotations = this.transformationObj.getAllObjectAnnotationsForSubject(this.currentAnnotation.id);
        for (let i = 0; i < objectAnnotations.length; ++i) {
          if (objectAnnotations[i].status === 'warning') {
            objectAnnotations[i].status = 'valid';
          }
        }
      }
      this.currentAnnotation.columnName = this.header;
      if (this.annotationForm.get('relationship.subject').value) {
        // TODO - this assumes a single annotation per column
        let annotationsForSubject = this.transformationObj.getColumnAnnotations(this.annotationForm.get('relationship.subject').value);
        if (annotationsForSubject.length) {
          this.currentAnnotation.subjectAnnotationId = annotationsForSubject[0].id;
        } else {
          // If the column has not been annotated yet, create an empty URI node annotation, add it and set the new ID
          let newAnnotationId = this.transformationObj.getUniqueId();
          let newAnnotationForSubject = new transformationDataModel.URINodeAnnotation(this.annotationForm.get('relationship.subject').value, null, [], [],
            "", true, 'invalid', newAnnotationId, "", [], null);
          this.transformationObj.addOrReplaceAnnotation(newAnnotationForSubject);
          this.currentAnnotation.subjectAnnotationId = newAnnotationId;
          this.currentAnnotation.status = 'warning';
        }
      }
      let selectedProperty = this.annotationForm.get('relationship.property').value;
      if (selectedProperty['suggestion']) { // when user select a suggestion from the autocomplete - TODO I don't think this happens
        this.currentAnnotation.properties = [new transformationDataModel.Property('', selectedProperty['suggestion'], [], [])];
      } else {
        this.currentAnnotation.properties = [new transformationDataModel.Property('', selectedProperty, [], [])];
      }


      if (valuesType === ColumnTypes.URI) {
        const types = [];
        (this.annotationForm.get('columnInfo.columnTypes') as FormArray).controls.forEach(ctrl => {
          let val = ctrl.get('columnType').value;
          if (val['suggestion']) { // when user select a suggestion from the autocomplete
            val = val['suggestion'];
          }
          if (val !== '') {
            types.push(new transformationDataModel.ConstantURI('', val, [], []));
          }
        });
        this.currentAnnotation.columnTypes = types;
        // Use the URL href instead of the user input
        const uriNamespace = this.annotationForm.get('columnInfo.urifyNamespace').value;
        this.currentAnnotation.urifyPrefix = this.annotationService.getPrefixForNamespace(uriNamespace, this.transformationObj);
      } else if (valuesType === ColumnTypes.Literal) {
        const datatype = this.annotationForm.get('columnInfo.columnDatatype').value;
        if (datatype === 'custom') {
          this.currentAnnotation.columnDatatype = this.annotationForm.get('columnInfo.customDatatype').value;
        } else {
          this.currentAnnotation.columnDatatype = XSDDatatypes[datatype];
          if (datatype === 'string') {
            this.currentAnnotation.langTag = this.annotationForm.get('columnInfo.langTag').value;
          }
        }
      }
      this.isSubject = this.transformationObj.isSubjectAnnotation(this.currentAnnotation);
      this.currentAnnotation.isSubject = this.isSubject;
      this.transformationObj.addOrReplaceAnnotation(this.currentAnnotation);
    }

    this.transformationSvc.transformationObjSource.next(this.transformationObj);

    this.submitted = true;
    this.dialogRef.close(this.currentAnnotation);
    this.dialogRef = null;
  }

  // Push initial suggestions to the user using ASIA MAS
  getInitialSuggestionsAsia() {
    this.suggesterSvc.masSuggestion(this.header).subscribe(column => {
      if (column.header.subjectSuggestions.length > 0) {
        (this.annotationForm
          .get('columnInfo.columnTypes') as FormArray)
          .controls[0]
          .get('columnType')
          .setValue(column.header.subjectSuggestions[0].suggestion);
      }
      if (column.header.propertySuggestions.length > 0) {
        this.annotationForm.get('relationship.property').setValue(column.header.propertySuggestions[0].suggestion);
      }
    });
  }

  deleteAnnotation() {
    this.resetForm();
    this.transformationObj.removeAnnotationById(this.currentAnnotation.id);
  }

  /**
   * Fill the subjects array with all columns that can be selected as source of this column
   * The array contains all table columns, except this column
   */
  fillAllowedSourcesArray() {
    this.allowedSources = [];
    this.annotationService.headers.forEach((h: string) => {
      if (h !== this.header) {
        this.allowedSources.push(h);
      }
    });
  }

  /**
   * Search for type suggestions
   * @param keyword
   * @returns {Observable<any[]>}
   */
  typeAutocomplete = (keyword: any): Observable<Object> => {
    return this.suggesterSvc.abstatAutocomplete(keyword, 'SUBJ');
  }

  /**
   * Search for property suggestions
   * @param keyword
   * @returns {Observable<any[]>}
   */
  propertyAutocomplete = (keyword: any): Observable<Object> => {
    return this.suggesterSvc.abstatAutocomplete(keyword, 'PRED');
  }

  /**
   * Custom rendering of autocomplete list
   * @param data
   * @returns {string}
   */
  autocompleteListFormatter = (data: any) => {
    return `<p class="p6 no-margin-top">${data.suggestion}</p>
                <p class="p7 no-margin-top">${data.occurrence} occurrences</p>
                <p class="p7 no-margin-top">from: ${data.dataset}</p>`;
  }
}
