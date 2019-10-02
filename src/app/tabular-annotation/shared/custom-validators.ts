import {AbstractControl, FormArray, ValidatorFn} from '@angular/forms';
import {ColumnTypes} from '../annotation.model';

export class CustomValidators {

  /**
   * Check if the langTag is valid, only if the datatype is equal to string.
   * @param {string} columnDatatypeCtrlName
   * @param {string} langTagCtrlName
   * @returns {ValidatorFn}
   */
  static langTagValidator(columnDatatypeCtrlName: string, langTagCtrlName: string): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      const dataTypeControl = control.get(columnDatatypeCtrlName);
      const langTagControl = control.get(langTagCtrlName);

      if (dataTypeControl && langTagControl) {
        const datatypeValue = dataTypeControl.value;
        const langTagValue = langTagControl.value;
        if (datatypeValue === 'string') {
          if (langTagValue.length === 0) {
            return {'invalidLangTag': {errorMessage: 'Language tag is required for strings'}};
          } else if (langTagValue.length !== 2) {
            return {'invalidLangTag': {errorMessage: 'Language tag must be of 2 chars'}};
          }
        }
        return null;
      }
    };
  }

  /**
   * Check if subject and property are both filled or empty
   * @param {string} subjectCtrlName
   * @param {string} propertyCtrlName
   * @param {string} colValuesTypeCtrlName
   * @returns {ValidatorFn}
   */
  static subjectPropertyValidators(subjectCtrlName: string, propertyCtrlName: string, filterMatchCtrlName: string,
                                   operatorCtrlName: string, thresholdPCtrlName: string,
                                   colValuesTypeCtrlName: string = null): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      const subjectControl = control.get(subjectCtrlName);
      const propertyControl = control.get(propertyCtrlName);
      const filterMatchControl = control.get(filterMatchCtrlName);
      const operatorControl = control.get(operatorCtrlName);
      const thresholdPControl = control.get(thresholdPCtrlName);
      const columnValuesTypeControl = control.get(colValuesTypeCtrlName);
      if (subjectControl && propertyControl && filterMatchControl && operatorControl && thresholdPControl) {
        const subjectValue = subjectControl.value;
        const propertyValue = propertyControl.value;
        const filterMatchValue = filterMatchControl.value;
        const operatorValue = operatorControl.value;
        const thresholdPValue = thresholdPControl.value;
        console.log('subjectValue: ' + subjectValue + ' propertyValue: ' + propertyValue + ' filterMatchValue: ' + filterMatchValue + ' operatorValue: ' + operatorValue + ' thresholdPValue: ' + thresholdPValue);
        if ((subjectValue !== '' || filterMatchValue !== '' || operatorValue !== '' || thresholdPValue !== '') && propertyValue === '') {
          return {'invalidProperty': {errorMessage: 'Requires a property'}};
        }

        if ((propertyValue !== '' || filterMatchValue !== '' || operatorValue !== '' || thresholdPValue !== '') && subjectValue === '') {
          return {'invalidSubject': {errorMessage: 'Required a source'}};
        }
        if ((propertyValue !== '' || subjectValue !== '' || operatorValue !== '' || thresholdPValue !== '') && filterMatchValue === '') {
          return {'invalidfilterMatch': {errorMessage: 'filterMatch required'}};
        }
        if ((propertyValue !== '' || subjectValue !== '' || filterMatchValue !== '' || thresholdPValue !== '') && operatorValue === '') {
          return {'invalidoperator': {errorMessage: 'operator required'}};
        }
        if ((propertyValue !== '' || subjectValue !== '' || filterMatchValue !== '' || operatorValue !== '') && thresholdPValue === '') {
          return {invalidthresholdP: {errorMessage: 'thresholdP requires a value'}};
        }

        if (columnValuesTypeControl) {
          const valuesTypeValue = columnValuesTypeControl.value;
          if (propertyValue === '' && subjectValue === '' && valuesTypeValue === ColumnTypes.Literal) {
            return {
              'invalidSubject': {errorMessage: 'Literal columns require a source'},
              'invalidProperty': {errorMessage: 'Literal columns require a property'}
            };
          }
        }

        return null;
      }
    };
  }

  static subjectPropertyValidator(subjectCtrlName: string, propertyCtrlName: string,
                                  colValuesTypeCtrlName: string = null): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      const subjectControl = control.get(subjectCtrlName);
      const propertyControl = control.get(propertyCtrlName);
      const columnValuesTypeControl = control.get(colValuesTypeCtrlName);

      if (subjectControl && propertyControl) {
        const subjectValue = subjectControl.value;
        const propertyValue = propertyControl.value;

        if ((subjectValue !== '') && propertyValue === '') {
          return {'invalidProperty': {errorMessage: 'A source requires a property'}};
        }

        if ((propertyValue !== '') && subjectValue === '') {
          return {'invalidSubject': {errorMessage: 'A property requires a source'}};
        }
        if (columnValuesTypeControl) {
          const valuesTypeValue = columnValuesTypeControl.value;
          if (propertyValue === '' && subjectValue === '' && valuesTypeValue === ColumnTypes.Literal) {
            return {
              'invalidSubject': {errorMessage: 'Literal columns require a source'},
              'invalidProperty': {errorMessage: 'Literal columns require a property'}
            };
          }
        }

        return null;
      }
    };
  }


  /**
   * Check if the selected column is contained in the array of allowed columns
   * @returns {ValidatorFn}
   */
  static columnValidator(allowedColumns: string[]): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      if (control.value !== '' && allowedColumns && !allowedColumns.includes(control.value)) {
        return {'invalidColumn': {errorMessage: 'This column is not allowed'}};
      }
      return null;
    };
  }

  /**
   * Check if the given source column is unique within its array
   * @returns {ValidatorFn}
   */
  static uniqueSourceValidator(sourceCtrlName: string): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      if (control.value !== '' && control.parent &&
        control.parent.parent instanceof FormArray &&
        (control.parent.parent as FormArray).controls
          .filter(s => s.get(sourceCtrlName).value === control.value).length > 1) {
        return {'invalidSource': {errorMessage: 'This source is already used'}};
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
          if (control.value.toString().includes('/http://')) {
            return {'invalidURL': {errorMessage: 'Property is a path separe with |'}};
          }
          const url = new URL(control.value);
          if (url.host === '') {
            return {'invalidURL': {errorMessage: 'This URL is not valid'}};
          }
        }
        return null;
      } catch (error) {
        return {'invalidURL': {errorMessage: 'This URL is not valid'}};
      }
    };
  }

  /**
   * Requires a custom datatype to be set whene the columnDatatype is 'custom'
   * @param {string} columnDatatypeCtrlName
   * @param {string} customDatatypeCtrlName
   * @returns {ValidatorFn}
   */
  static customDatatypeValidator(columnDatatypeCtrlName: string, customDatatypeCtrlName: string): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      const dataTypeControl = control.get(columnDatatypeCtrlName);
      const customTypeControl = control.get(customDatatypeCtrlName);

      if (dataTypeControl && customTypeControl) {
        const datatypeValue = dataTypeControl.value;
        const customTypeValue = customTypeControl.value;
        if (datatypeValue === 'custom' && customTypeValue === '') {
          return {'invalidCustomDatatype': {errorMessage: 'A custom datatype must be specified'}};
        }
        return null;
      }
    };
  }

  /**
   * Requires at least one column type to be set when the columnValuesType is 'URI'
   * @param {string} columnTypesCtrlName
   * @param {string} columnValuesTypeCtrlName
   * @returns {ValidatorFn}
   */
  static columnTypesValidator(columnTypesCtrlName: string, columnValuesTypeCtrlName: string): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      const typesControls = (control.get(columnTypesCtrlName) as FormArray).controls;
      const valuesTypeControl = control.get(columnValuesTypeCtrlName);
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
            return {'invalidColumnTypes': {errorMessage: 'At least one column type is required'}};
          }
        }
      }
      return null;
    };
  }

  /**
   * Requires the URIfy prefix to be set when the columnValuesType is 'URI'
   * @param {string} urifyNamespaceCtrlName
   * @param {string} columnValuesTypeCtrlName
   * @returns {ValidatorFn}
   */
  static urifyNamespaceValidator(urifyNamespaceCtrlName: string, columnValuesTypeCtrlName: string): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      const urifyNamespaceControl = control.get(urifyNamespaceCtrlName);
      const valuesTypeControl = control.get(columnValuesTypeCtrlName);

      if (urifyNamespaceControl && valuesTypeControl) {
        const urifyNamespaceValue = urifyNamespaceControl.value;
        const valuesTypeValue = valuesTypeControl.value;
        if (valuesTypeValue === ColumnTypes.URI && urifyNamespaceValue === '') {
          return {'invalidUrifyNamespace': {errorMessage: 'An URIfy namespace is required'}};
        }
        return null;
      }
    };
  }
}
