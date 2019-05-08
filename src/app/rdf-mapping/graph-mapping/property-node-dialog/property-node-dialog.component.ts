import { Component, OnInit, EventEmitter, OnDestroy } from '@angular/core';
import { FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TransformationService } from 'app/transformation.service';
import { RdfVocabularyService } from 'app/rdf-mapping/rdf-vocabulary.service';
import * as transformationDataModel from 'assets/transformationdatamodel.js';

@Component({
  selector: 'app-property-node-dialog',
  templateUrl: './property-node-dialog.component.html',
  styleUrls: ['./property-node-dialog.component.scss']
})
export class PropertyNodeDialogComponent implements OnInit, OnDestroy {

  // The property being edited
  editedProperty: any;

  // The sibling property to add after
  siblingProperty: any;

  // The parent node of the property
  parentNode: any;

  // Emits an event when we close the dialog so the component can be destroyed
  close = new EventEmitter();

  // Opening mapping dialog is controlled using this variables
  openPropertyMappingDialog = true;

  // The state of the node condition switch
  nodeConditionChecked = false;

  // The array for column name to be used in mapping and a variable for the currently selected condition
  private columns: Array<any> = [];
  private selectedConditionColumn: string;

  // The supported conditional operators and a variable for the currently selected operator
  private conditionOperators = [
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

  // The operand for the conditional mapping
  private conditionOperand: any;

  // The value of the mapped property node
  propertyNodeValue: string;

  // Form controller for validation of the input for literal URIs
  propertyNameFormControl = new FormControl('', [
    Validators.required,
    this.isValidIRI
  ]);

  private dataSubscription: Subscription;

  // Subscription to the RDF vocabulary service for the rdf vocabularies and the arrays that hold the default and transformation vocabs
  private rdfVocabsSubscription: Subscription;
  private defaultVocabs: Array<any>;
  private transformationVocabs: Array<any>;

  // Subscription to the transformation service for the data transformation
  private transformationSubscription: Subscription;
  private transformationObj: any;

  constructor(private rdfVocabSvc: RdfVocabularyService, private transformationSvc: TransformationService) { }

  ngOnInit() {
    this.rdfVocabsSubscription = this.rdfVocabSvc.allRdfVocabObservable.subscribe((rdfVocabsObj) => {
      this.defaultVocabs = rdfVocabsObj.defaultVocabs;
      this.transformationVocabs = rdfVocabsObj.transformationVocabs;
    });

    this.dataSubscription = this.transformationSvc.currentGraftwerkData.subscribe((graftwerkData) => {
      if (graftwerkData[':column-names']) {
        this.columns = graftwerkData[':column-names'].map((columnName) => {
          if (columnName.indexOf(':') === 0) {
            return columnName.substring(1, columnName.length);
          } else {
            return columnName;
          }
        });
      }
    });

    this.transformationSubscription = this.transformationSvc.currentTransformationObj.subscribe((transformation) => {
      this.transformationObj = transformation;
    });
  }

  ngOnDestroy() {
    this.rdfVocabsSubscription.unsubscribe();
    this.dataSubscription.unsubscribe();
    this.transformationSubscription.unsubscribe();
  }

  private getConditionOperator(id): any {
    for (let i = 0; i < this.conditionOperators.length; ++i) {
      if (this.conditionOperators[i].id === id) {
        return this.conditionOperators[i];
      }
    }
    return null;
  }

  private getConditionObject(): any {
    let nodeCondition = null;
    if (this.selectedConditionColumn) {
      if (typeof this.selectedOperator === 'number') {
        const operator = this.getConditionOperator(this.selectedOperator);
        if (operator) {
          if (operator.id === 0) {
            return [new transformationDataModel.Condition(this.selectedConditionColumn, operator, '', null)];
          } else {
            return [new transformationDataModel.Condition(this.selectedConditionColumn, operator, this.conditionOperand, null)];
          }
        }
      }
    }
    return [];
  }


  createAndAddNewProperty() {
    let newProperty = {};
    let nodeCondition = [];
    let prefix = '';
    let propertyNodeName = '';
    if (PropertyNodeDialogComponent.isProbablyURI(this.propertyNodeValue)) {
      // Probably a URI/IRI
      propertyNodeName = this.propertyNodeValue;
    } else if (PropertyNodeDialogComponent.isProbablyQualifiedName(this.propertyNodeValue)) {
      // Probably a qualified name
      prefix = this.propertyNodeValue.substring(0, this.propertyNodeValue.indexOf(':'));
      propertyNodeName = this.propertyNodeValue.substring(this.propertyNodeValue.indexOf(':') + 1);
    }

    // Create node condition
    if (this.nodeConditionChecked) {
      nodeCondition = this.getConditionObject();
    }
    if (this.editedProperty && this.parentNode) {
      // Edit existing property
      newProperty = new transformationDataModel.Property(prefix, propertyNodeName, nodeCondition, this.editedProperty.subElements);
      this.parentNode.replaceChild(this.editedProperty, newProperty);
      this.transformationSvc.changeTransformationObj(this.transformationObj);
    } else if (this.parentNode && this.siblingProperty) {
      // Add new property after
      newProperty = new transformationDataModel.Property(prefix, propertyNodeName, nodeCondition, null);
      this.parentNode.addNodeAfter(this.siblingProperty, newProperty);
      this.transformationSvc.changeTransformationObj(this.transformationObj);
    } else if (this.parentNode) {
      // Add new child property
      newProperty = new transformationDataModel.Property(prefix, propertyNodeName, nodeCondition, null);
      this.parentNode.addChild(newProperty);
      this.transformationSvc.changeTransformationObj(this.transformationObj);
    }
  }

  loadNodeCondition(nodeCondition) {
    // Toggle on the node condition switch
    this.nodeConditionChecked = true;

    this.selectedConditionColumn = typeof nodeCondition.column === 'object' ? nodeCondition.column.value : nodeCondition.column;

    if (typeof nodeCondition.operator === 'object') {
      this.selectedOperator = nodeCondition.operator.id;
    }

    if (nodeCondition.operand !== '') {
      this.conditionOperand = nodeCondition.operand;
    }
  }

  loadProperty(editedProperty: any, parentNode: any, siblingProperty: any) {
    this.editedProperty = editedProperty;
    this.parentNode = parentNode;
    this.siblingProperty = siblingProperty;

    if (editedProperty) {
      if (editedProperty.prefix) {
        this.propertyNodeValue = editedProperty.prefix + ':' + editedProperty.propertyName;
      } else {
        this.propertyNodeValue = editedProperty.propertyName;
      }

      // Select node condition; currently we only view the first condition - we can later add support for more conditions
      if (editedProperty.propertyCondition.length > 0) {
        this.loadNodeCondition(editedProperty.propertyCondition[0]);
      }
    }

  }

  isValidIRI(control: AbstractControl): ValidationErrors {
    // if it is (probably) a URI (or IRI) or qualified name - no validation error
    if (control.value) {
      if (PropertyNodeDialogComponent.isProbablyURI(control.value) || PropertyNodeDialogComponent.isProbablyQualifiedName(control.value)) {
        return null;
      }
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
    if (split.length === 2) {
      // two if-s for null safety
      if (split[1].length > 0) {
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

  conditionToggleChanged(event) {
    this.nodeConditionChecked = event.checked;
  }

  onClickedExit() {
    this.openPropertyMappingDialog = false;
    this.close.emit('closed dialog');
  }

  ok() {
    this.createAndAddNewProperty();
    this.onClickedExit();
  }
  cancel() {
    this.onClickedExit();
  }
}
