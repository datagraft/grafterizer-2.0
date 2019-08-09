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
import { Annotation, ColumnTypes, XSDDatatypes } from '../annotation.model';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { Observable } from 'rxjs';
import {AsiaMasService} from '../asia-mas/asia-mas.service';
import {CustomValidators} from '../shared/custom-validators';

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

  public annotation: Annotation;
  displayURINamespace = false;
  displayDatatype = false;
  displayType = false;
  displayLangTag = true; // because the default datatype is string
  displayCustomDatatype = false;

  allowedSources: string[];
  availableNamespaces: string[];
  availableColumnValuesTypes = Object.keys(ColumnTypes);
  availableDatatypes = Object.keys(XSDDatatypes);

  annotationForm: FormGroup;

  constructor(public annotationService: AnnotationService,
    private suggesterSvc: AsiaMasService,
    public dialogRef: MatDialogRef<AnnotationFormComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogInputData: any) {
  }

  ngOnInit() {
    this.header = this.dialogInputData.header;
    this.annotationService.subjects.forEach((value: string) => {
      if (value === this.header) {
        this.isSubject = true;
      }
    });
    this.annotation = this.dialogInputData.annotation;
    const namespacesSet = new Set<string>();
    this.dialogInputData.rdfVocabs.forEach(vocab => namespacesSet.add(vocab.namespace));
    this.availableNamespaces = Array.from(namespacesSet);
    this.fillAllowedSourcesArray();
    this.buildForm();
    this.onChanges();
    if (this.annotation == null) {
      this.annotationsSuggestion();
      this.annotation = new Annotation();
    } else {
      this.setFormFromAnnotation();
    }
  }

  ngOnDestroy() {
    // Don't save anything since each valid annotation is already stored into the service
  }

  buildForm() {
    this.annotationForm = new FormGroup({
      columnInfo: new FormGroup({
        columnTypes: new FormArray([this.createColType()]),
        columnValuesType: new FormControl('', this.subjectValuesTypeValidator()),
        urifyNamespace: new FormControl('', CustomValidators.URLValidator()),
        columnDatatype: new FormControl('string'),
        customDatatype: new FormControl('', CustomValidators.URLValidator()),
        langTag: new FormControl('en'),
      }),
      relationship: new FormGroup({
        subject: new FormControl('', CustomValidators.subjectValidator(this.allowedSources)),
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
    this.annotationForm.get('relationship.subject').setValue(this.annotation.subject);
    this.annotationForm.get('relationship.property').setValue(this.annotation.property);

    const valuesType = this.annotation.columnValuesType;
    this.annotationForm.get('columnInfo.columnValuesType').setValue(valuesType);
    if (valuesType === ColumnTypes.URI) {
      const types = this.annotation.columnTypes;
      for (let i = 0; i < types.length; ++i) {
        (this.annotationForm.get('columnInfo.columnTypes') as FormArray).controls[i].get('columnType').setValue(types[i]);
        this.addColType(i);
      }
      this.annotationForm.get('columnInfo.urifyNamespace').setValue(this.annotation.urifyNamespace);
    } else if (valuesType === ColumnTypes.Literal) {
      const xsdDatatype = this.annotation.columnDatatype;
      let datatype = Object.keys(XSDDatatypes).find(key => XSDDatatypes[key] === xsdDatatype);
      if (!datatype) {
        datatype = 'custom';
      }
      this.annotationForm.get('columnInfo.columnDatatype').setValue(datatype);
      if (datatype === 'custom') {
        this.annotationForm.get('columnInfo.customDatatype').setValue(this.annotation.columnDatatype);
      }
      if (datatype === 'string') {
        this.annotationForm.get('columnInfo.langTag').setValue(this.annotation.langTag);
      }
    }
    this.changeValuesType(valuesType); // this method marks the field as dirty
    this.annotationForm.get('columnInfo.columnValuesType').markAsPristine();

    this.isObject = this.annotation.subject !== '' && this.annotation.property !== '';
    if (this.annotationForm.get('relationship.subject').invalid) { // check if the subject column exists)
      this.annotationForm.get('relationship.subject').markAsDirty();
      this.annotationService.removeAnnotation(this.header);
      this.submitted = false;
    } else if (this.annotationForm.get('columnInfo.columnValuesType').invalid) { // check if the values type is valid
      this.annotationForm.get('relationship.subject').markAsDirty();
      this.annotationService.removeAnnotation(this.header);
      this.submitted = false;
    } else {
      this.annotationForm.markAsPristine();
      this.submitted = true;
    }
  }

  resetForm() {
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
    this.annotation = new Annotation();
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
      if (this.submitted) {
        let changed = false;
        const oldAnnotation = this.annotationService.getAnnotation(this.header);
        const literalProps = ['columnDatatype', 'customDatatype', 'langTag'];
        const URIProps = ['columnTypes', 'urifyNamespace'];
        const commonProps = ['subject', 'property'];

        const newValuesType = valuesObj.columnInfo.columnValuesType;
        if (newValuesType !== oldAnnotation.columnValuesType) { // check new type
          changed = true;
        }
        let i = 0;
        while (!changed && i < commonProps.length) { // check relationship
          const prop = commonProps[i];
          if (oldAnnotation.hasOwnProperty(prop)) {
            const oldValue = oldAnnotation[prop];
            const newValue = valuesObj['relationship'][prop];
            if (oldValue !== newValue) {
              changed = true;
            }
          }
          i++;
        }
        i = 0;
        if (newValuesType === ColumnTypes.URI) { // check URI properties
          while (!changed && i < URIProps.length) {
            const prop = URIProps[i];
            if (oldAnnotation.hasOwnProperty(prop)) {
              const oldValue = oldAnnotation[prop];
              const newValue = valuesObj['columnInfo'][prop];
              if (oldValue !== newValue) {
                changed = true;
              }
            }
            i++;
          }
        } else if (newValuesType === ColumnTypes.Literal) { // check Literal properties
          while (!changed && i < literalProps.length) {
            const prop = literalProps[i];
            if (oldAnnotation.hasOwnProperty(prop)) {
              const oldValue = oldAnnotation[prop];
              let newValue = valuesObj['columnInfo'][prop];
              if (prop === 'columnDatatype') {
                newValue = XSDDatatypes[newValue];
              }
              if (oldValue !== newValue) {
                changed = true;
              }
            }
            i++;
          }
        }

        if (changed) {
          this.submitted = false;
          this.annotation = new Annotation();
          this.annotationService.removeAnnotation(this.header);
        }
      }
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
   * Update form when column values type changes
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
    }
    if (columnDatatype === ColumnTypes.Literal) {
      if (this.annotationForm.get('columnInfo.columnDatatype').value === 'custom') {
        this.displayCustomDatatype = true;
      }
      this.displayType = false;
      this.displayURINamespace = false;
      this.displayDatatype = true;
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
   * Apply changes to the annotation model when the form is submitted
   */
  onSubmit() {
    this.annotation.columnHeader = this.header;
    this.annotation.subject = this.annotationForm.get('relationship.subject').value;
    this.annotation.property = this.annotationForm.get('relationship.property').value;
    if (this.annotation.property['suggestion']) { // when user select a suggestion from the autocomplete
      this.annotation.property = this.annotation.property['suggestion'];
    }
    const valuesType = this.annotationForm.get('columnInfo.columnValuesType').value;
    this.annotation.columnValuesType = valuesType;
    if (valuesType === ColumnTypes.URI) {
      const types = [];
      (this.annotationForm.get('columnInfo.columnTypes') as FormArray).controls.forEach(ctrl => {
        let val = ctrl.get('columnType').value;
        if (val['suggestion']) { // when user select a suggestion from the autocomplete
          val = val['suggestion'];
        }
        if (val !== '') {
          types.push(val);
        }
      });
      this.annotation.columnTypes = types;
      // Use the URL href instead of the user input
      const uriNamespace = this.annotationForm.get('columnInfo.urifyNamespace').value;
      this.annotation.urifyNamespace = new URL(uriNamespace).href;
    } else if (valuesType === ColumnTypes.Literal) {
      const datatype = this.annotationForm.get('columnInfo.columnDatatype').value;
      if (datatype === 'custom') {
        this.annotation.columnDatatype = this.annotationForm.get('columnInfo.customDatatype').value;
      } else {
        this.annotation.columnDatatype = XSDDatatypes[datatype];
        if (datatype === 'string') {
          this.annotation.langTag = this.annotationForm.get('columnInfo.langTag').value;
        }
      }
    }
    this.annotationService.subjects.forEach((value: string) => {
      if (value === this.header) {
        this.isSubject = true;
      }
    });
    this.annotation.isSubject = this.isSubject;
    this.annotationService.setAnnotation(this.header, this.annotation);
    this.annotationForm.markAsPristine();
    this.submitted = true;
    this.dialogRef.close(this.annotation);
  }

  // Push initial suggestions to the user using ASIA MAS
  annotationsSuggestion() {
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
    this.annotationService.removeAnnotation(this.header);
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
  typeAutocomplete = (keyword: any): Observable<any[]> => {
    return this.suggesterSvc.abstatAutocomplete(keyword, 'subj');
  }

  /**
   * Search for property suggestions
   * @param keyword
   * @returns {Observable<any[]>}
   */
  propertyAutocomplete = (keyword: any): Observable<any[]> => {
    return this.suggesterSvc.abstatAutocomplete(keyword, 'pred');
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
