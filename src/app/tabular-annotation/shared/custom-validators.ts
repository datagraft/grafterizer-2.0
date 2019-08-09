import {AbstractControl, FormArray, FormGroup, ValidatorFn} from '@angular/forms';
import {ColumnTypes} from '../annotation.model';

export class CustomValidators {

  /**
   * Check if the langTag is valid, only if the datatype is equal to string.
   * @param {string} columnDatatype
   * @param {string} langTag
   * @returns {ValidatorFn}
   */
  static langTagValidator(columnDatatype: string, langTag: string): ValidatorFn {
    return (group: FormGroup): { [key: string]: any } => {
      const dataTypeControl = group.get(columnDatatype);
      const langTagControl = group.get(langTag);

      if (dataTypeControl && langTagControl) {
        const datatypeValue = dataTypeControl.value;
        const langTagValue = langTagControl.value;
        if (datatypeValue === 'string') {
          if (langTagValue.length === 0) {
            return { 'invalidLangTag': { errorMessage: 'Language tag is required for strings' } };
          } else if (langTagValue.length !== 2) {
            return { 'invalidLangTag': { errorMessage: 'Language tag must be of 2 chars' } };
          }
        }
        return null;
      }
    };
  }

  /**
   * Check if subject and property are both filled or empty
   * @param {string} subject
   * @param {string} property
   * @param {string} colValuesType
   * @returns {ValidatorFn}
   */
  static subjectPropertyValidator(subject: string, property: string, colValuesType: string): ValidatorFn {
    return (group: FormGroup): { [key: string]: any } => {
      const subjectControl = group.get(subject);
      const propertyControl = group.get(property);
      const columnValuesTypeControl = group.get(colValuesType);

      if (subjectControl && propertyControl && columnValuesTypeControl) {
        const subjectValue = subjectControl.value;
        const propertyValue = propertyControl.value;
        const valuesTypeValue = columnValuesTypeControl.value;

        if (subjectValue !== '' && propertyValue === '') {
          return { 'invalidProperty': { errorMessage: 'A source requires a property' } };
        }
        if (propertyValue !== '' && subjectValue === '') {
          return { 'invalidSubject': { errorMessage: 'A property requires a source' } };
        }
        if (propertyValue === '' && subjectValue === '' && valuesTypeValue === ColumnTypes.Literal) {
          return {
            'invalidSubject': { errorMessage: 'Literal columns require a source' },
            'invalidProperty': { errorMessage: 'Literal columns require a property' }
          };
        }
        return null;
      }
    };
  }

  /**
   * Check if the selected source is contained in the array of allowed sources
   * @returns {ValidatorFn}
   */
  static subjectValidator(allowedSources: string[]): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      if (control.value !== '' && allowedSources && allowedSources.indexOf(control.value) === -1) {
        return { 'invalidSubject': { errorMessage: 'This subject is not allowed' } };
      }
      return null;
    };
  }

  /**
   * Check if the selected URL is valid
   * @returns {ValidatorFn}
   */
  static URLValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      try {
        if (control.value !== '') {
          const url = new URL(control.value);
          if (url.host === '') {
            return { 'invalidURL': { errorMessage: 'This URL is not valid' } };
          }
        }
        return null;
      } catch (error) {
        return { 'invalidURL': { errorMessage: 'This URL is not valid' } };
      }
    };
  }

  /**
   * Requires a custom datatype to be set whene the columnDatatype is 'custom'
   * @param {string} columnDatatype
   * @param {string} customDatatype
   * @returns {ValidatorFn}
   */
  static customDatatypeValidator(columnDatatype: string, customDatatype: string): ValidatorFn {
    return (group: FormGroup): { [key: string]: any } => {
      const dataTypeControl = group.get(columnDatatype);
      const customTypeControl = group.get(customDatatype);

      if (dataTypeControl && customTypeControl) {
        const datatypeValue = dataTypeControl.value;
        const customTypeValue = customTypeControl.value;
        if (datatypeValue === 'custom' && customTypeValue === '') {
          return { 'invalidCustomDatatype': { errorMessage: 'A custom datatype must be specified' } };
        }
        return null;
      }
    };
  }

  /**
   * Requires at least one column type to be set when the columnValuesType is 'URI'
   * @param {string} columnTypes
   * @param {string} columnValuesType
   * @returns {ValidatorFn}
   */
  static columnTypesValidator(columnTypes: string, columnValuesType: string): ValidatorFn {
    return (group: FormGroup): { [key: string]: any } => {
      const typesControls = (group.get(columnTypes) as FormArray).controls;
      const valuesTypeControl = group.get(columnValuesType);
      if (typesControls && valuesTypeControl) {
        const valuesTypeValue = valuesTypeControl.value;
        if (valuesTypeValue === ColumnTypes.URI) {
          let error = true;
          for (let i = 0; i < typesControls.length; ++i) {
            const typeValue = typesControls[i].get('columnType').value;
            if (typeValue !== '') {
              error = false;
              break;
            }
          }
          if (error) {
            return { 'invalidColumnTypes': { errorMessage: 'At least one column type is required' } };
          }
        }
      }
      return null;
    };
  }

  /**
   * Requires the URIfy prefix to be set when the columnValuesType is 'URI'
   * @param {string} urifyNamespace
   * @param {string} columnValuesType
   * @returns {ValidatorFn}
   */
  static urifyNamespaceValidator(urifyNamespace: string, columnValuesType: string): ValidatorFn {
    return (group: FormGroup): { [key: string]: any } => {
      const urifyNamespaceControl = group.get(urifyNamespace);
      const valuesTypeControl = group.get(columnValuesType);

      if (urifyNamespaceControl && valuesTypeControl) {
        const urifyNamespaceValue = urifyNamespaceControl.value;
        const valuesTypeValue = valuesTypeControl.value;
        if (valuesTypeValue === ColumnTypes.URI && urifyNamespaceValue === '') {
          return { 'invalidUrifyNamespace': { errorMessage: 'An URIfy namespace is required' } };
        }
        return null;
      }
    };
  }
}
