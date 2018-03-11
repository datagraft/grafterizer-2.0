import { Component, OnInit, Input, EventEmitter, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { FormControl, Validators, ValidationErrors, AbstractControl, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import { startWith } from 'rxjs/operators/startWith';
import { map } from 'rxjs/operators/map';
import { MatAutocomplete } from '@angular/material';

@Component({
  selector: 'rdf-node-mapping-dialog',
  templateUrl: './rdf-node-mapping-dialog.component.html',
  styleUrls: ['./rdf-node-mapping-dialog.component.scss']
})
export class RdfNodeMappingDialogComponent implements OnInit {

  private assignDataTypeChecked: boolean;
  private openNodeMappingDialog = true;
  private uriNodeTabSelected: boolean;
  private literalNodeTabSelected: boolean;
  private blankNodeSelected: boolean;
  private currentlySelectedFunction: any;

  close = new EventEmitter();

  prefixes = ['foaf', 'sioc', 'org', 'aaa', 'aaaa', 'aaaaa', 'aaaaaa', 'aaaaaaa', 'aaab', 'aaabb', 'aaac', 'aaad', 'aaae', 'aaaq', 'aaaw'];
  private selectedPrefix: any;

  columns = ['column1', 'column2', 'column3', 'column4', 'column5', 'column6', 'column7', 'column8', 'column9', 'column10', 'column11', 'column12', 'column13', 'column14', 'column15'];
  private selectedColumn: any;

  conditionOperators = [
    {
      id: 0,
      name: 'Not empty'
    },
    {
      id: 1,
      name: 'Equals (=)'
    },
    {
      id: 2,
      name: 'Not equals (!=)'
    },
    {
      id: 3,
      name: 'Greater than (>)'
    },
    {
      id: 4,
      name: 'Less than (<)'
    },
    {
      id: 5,
      name: 'Contains text'
    },

    {
      id: 6,
      name: 'Custom code'
    }];
  private selectedOperator: any;
  private selectedConditionColumn: any;
  private conditionOperand: any;

  private nodeConditionChecked = false;

  private showDocumentation = false;

  private nodeIRI: string;

  dataTypes = [
    {
      id: 0,
      name: 'byte'
    },
    {
      id: 1,
      name: 'short'
    },
    {
      id: 2,
      name: 'integer'
    },
    {
      id: 3,
      name: 'long'
    },
    {
      id: 4,
      name: 'decimal'
    },

    {
      id: 5,
      name: 'float'
    },
    {
      id: 6,
      name: 'double'
    },

    {
      id: 7,
      name: 'boolean'
    },

    {
      id: 8,
      name: 'datetime'
    },
    {
      id: 9,
      name: 'string'
    },
    {
      id: 10,
      name: 'custom'
    },

    {
      id: 11,
      name: 'date'
    },
    {
      id: 12,
      name: 'time'
    },
    {
      id: 13,
      name: 'dateTimeStamp'
    },
    {
      id: 14,
      name: 'gYear'
    },
    {
      id: 15,
      name: 'gMonth'
    },
    {
      id: 16,
      name: 'gDay'
    },
    {
      id: 17,
      name: 'gYearMonth'
    },
    {
      id: 18,
      name: 'gMonthDay'
    },
    {
      id: 19,
      name: 'duration'
    },
    {
      id: 20,
      name: 'yearMonthDuration'
    },
    {
      id: 21,
      name: 'dayTimeDuration'
    },
    {
      id: 22,
      name: 'int'
    },
    {
      id: 23,
      name: 'unsignedByte'
    },
    {
      id: 24,
      name: 'unsignedShort'
    },
    {
      id: 25,
      name: 'unsignedInt'
    },
    {
      id: 26,
      name: 'unsignedLong'
    },
    {
      id: 27,
      name: 'positiveInteger'
    },
    {
      id: 28,
      name: 'nonNegativeInteger'
    },
    {
      id: 29,
      name: 'negativeInteger'
    },
    {
      id: 30,
      name: 'nonPositiveInteger'
    },
    {
      id: 31,
      name: 'hexBinary'
    },
    {
      id: 32,
      name: 'base64Binary'
    },
    {
      id: 33,
      name: 'anyURI'
    },
    {
      id: 34,
      name: 'language'
    },
    {
      id: 35,
      name: 'normalizedString'
    },
    {
      id: 36,
      name: 'token'
    },
    {
      id: 37,
      name: 'NMTOKEN'
    },
    {
      id: 38,
      name: 'Name'
    },
    {
      id: 39,
      name: 'NCName'
    }
  ];
  private selectedDataType: any;
  private valueOnError: any;
  private valueOnEmpty: any;


  nodeIRIFormControl = new FormControl('', [
    Validators.required,
    this.isValidIRI
  ]);

  constructor() { }

  ngOnInit() {
  }

  isValidIRI(control: AbstractControl): ValidationErrors {
    console.log(this);
    // if it is (probably) a URI (or IRI) or qualified name - no validation error
    if (RdfNodeMappingDialogComponent.isProbablyURI(control.value) || RdfNodeMappingDialogComponent.isProbablyQualifiedName(control.value)) {
      return null;
    }

    return {
      invalid_iri: {
        iri: control.value
      }

    };
  }

  static isProbablyQualifiedName(string: string): boolean {
    const split = string.split(":");
    // if there is exactly one colon and both sides of it are non-empty it is probably a QName
    if (split.length - 1 === 1) {
      // two if-s for null safety
      if (split[0].length > 0 && split[1].length > 0) {
        return true;
      }
    }
    return false;
  }

  static isProbablyURI(string: string): boolean {
    var uriRegEx = new RegExp('^' +
      '(?:' +
      '([^:/?#]+)' +         // scheme
      ':)?' +
      '(?://' +
      '(?:([^/?#]*)@)?' +    // credentials
      '([^/?#:@]*)' +        // domain
      '(?::([0-9]+))?' +     // port
      ')?' +
      '([^?#]+)?' +            // path
      '(?:\\?([^#]*))?' +      // query
      '(?:#(.*))?' +           // fragment
      '$');
    var match = ('' + string).match(uriRegEx);

    // probably a full URI (and not a qualified name) if it has a scheme and a domain
    if (match[1]) {
      // has a scheme
      if (match[3]) {
        // has a domain
        return true;
      }
    }
    return false;
  }

  public selectTab(tabName: string) {
    switch (tabName) {
      case 'uri':
        this.uriNodeTabSelected = true;
        this.literalNodeTabSelected = false;
        this.blankNodeSelected = false;
        break;
      case 'literal':
        this.uriNodeTabSelected = false;
        this.literalNodeTabSelected = true;
        this.blankNodeSelected = false;
        break;
      case 'blank':
        this.uriNodeTabSelected = false;
        this.literalNodeTabSelected = false;
        this.blankNodeSelected = true;
        break;
    }
  }

  onClickedExit() {
    this.openNodeMappingDialog = false;
    this.close.emit('closed dialog');
  }

  mappingTypeSelectChanged(selectedType) {
    console.log(selectedType);
  }

  cancel() {
    this.onClickedExit();
  }

  ok() {
    this.onClickedExit();
  }

  conditionToggleChanged(event) {
    this.nodeConditionChecked = event.checked;
  }

  assignDatatypeToggleChanged(event) {
    this.assignDataTypeChecked = event.checked;
  }
}
