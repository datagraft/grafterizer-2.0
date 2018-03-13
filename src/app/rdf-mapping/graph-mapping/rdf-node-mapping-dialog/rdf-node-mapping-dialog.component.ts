import { Component, OnInit, Input, EventEmitter, ViewChild, ViewChildren, QueryList, OnDestroy } from '@angular/core';
import { FormControl, Validators, ValidationErrors, AbstractControl, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import { startWith } from 'rxjs/operators/startWith';
import { map } from 'rxjs/operators/map';
import { MatAutocomplete } from '@angular/material';
import * as transformationDataModel from 'assets/transformationdatamodel.js';
import { RdfVocabularyService } from 'app/rdf-mapping/rdf-vocabulary.service';
import { TransformationService } from 'app/transformation.service';
import { Subscription } from 'rxjs';
import { ConstantLiteral } from 'assets/transformationdatamodel.js';

@Component({
  selector: 'rdf-node-mapping-dialog',
  templateUrl: './rdf-node-mapping-dialog.component.html',
  styleUrls: ['./rdf-node-mapping-dialog.component.scss']
})
export class RdfNodeMappingDialogComponent implements OnInit, OnDestroy {

  // The mapping node that is edited (in case of editing)
  private editedNode: any;

  // The parent node in case we are creating a new node
  private parentNode: any;

  // The sibling node in case we are adding a new node after an existing node
  private siblingNode: any;

  // Opening mapping dialog is controlled using this variabls
  private openNodeMappingDialog = true;

  // Boolean attributes that determine which tab has been selected in the dialog
  private uriNodeTabSelected: boolean;
  private literalNodeTabSelected: boolean;
  private blankNodeSelected: boolean;

  private selectedSourceType = 'dataset-col';

  // Emits an event when we close the dialog so the component can be destroyed
  close = new EventEmitter();

  // The array for prefix names to be used in mapping and a variable for the currently selected prefix
  private prefixes: Array<string> = [];
  private selectedPrefix: any;

  // The array for column name to be used in mapping and a variable for the currently selected column
  private columns: Array<string> = [];
  private selectedColumn: any;

  // Constant literal node value
  private literalNodeValue: string;

  // The supported conditional operators and a variable for the currently selected operator
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

  // The currently selected column for the conditional mapping
  private selectedConditionColumn: any;

  // The operand for the conditional mapping
  private conditionOperand: any;

  // The state of the node condition switch
  private nodeConditionChecked = false;

  // Whether the documentation about literal types should be displayed
  private showDocumentation = false;

  // The supported data types for literals
  private dataTypes = [
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

  // The selected data type for a literal
  private selectedDataType: any;

  // Column literals' language tag (in case of strings)
  private langTag: string;

  // Column literals' custom type URI
  private customTypeURI: string;

  // The IRI/qualified name for a node
  private nodeIRI: string;

  // Value on error or on empty for literal nodes
  private valueOnError: any;
  private valueOnEmpty: any;

  // if we have checked the box to assign a datatype to literal node mappings
  private assignDataTypeChecked: boolean;

  // Form controller for validation of the input for literal URIs
  nodeIRIFormControl = new FormControl('', [
    Validators.required,
    this.isValidIRI
  ]);

  // Subscription to the RDF vocabulary service for the rdf vocabularies and the arrays that hold the default and transformation vocabs
  private rdfVocabsSubscription: Subscription;
  private defaultVocabs: Array<any>;
  private transformationVocabs: Array<any>;

  // Subscription to the Transformation service for the data
  private dataSubscription: Subscription;

  // Subscription to the transformation service for the data transformation
  private transformationSubscription: Subscription;
  private transformationObj: any;

  constructor(private rdfVocabSvc: RdfVocabularyService, private transformationSvc: TransformationService) {

  }

  ngOnInit() {
    this.rdfVocabsSubscription = this.rdfVocabSvc.allRdfVocabObservable.subscribe((rdfVocabsObj) => {
      this.prefixes = [];
      this.defaultVocabs = rdfVocabsObj.defaultVocabs;
      this.transformationVocabs = rdfVocabsObj.transformationVocabs;

      rdfVocabsObj.transformationVocabs.forEach((rdfVocab) => {
        this.prefixes.push(rdfVocab.name);
      });

      rdfVocabsObj.defaultVocabs.forEach((rdfVocab) => {
        this.prefixes.push(rdfVocab.name);
      });
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
  }

  isValidIRI(control: AbstractControl): ValidationErrors {
    // if it is (probably) a URI (or IRI) or qualified name - no validation error
    if (control.value) {
      if (RdfNodeMappingDialogComponent.isProbablyURI(control.value) || RdfNodeMappingDialogComponent.isProbablyQualifiedName(control.value)) {
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

  private selectTab(tabName: string) {
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

  private getDatatypeObject(id): any {
    for (let i = 0; i < this.dataTypes.length; ++i) {
      if (this.dataTypes[i].id === id) {
        return this.dataTypes[i];
      }
    }
    return null;
  }

  createAndAddNewNode(): any {
    let newNode = {};
    let nodeCondition = [];
    if (this.uriNodeTabSelected && !this.literalNodeTabSelected && !this.blankNodeSelected) {
      if (this.selectedSourceType === 'dataset-col') {
        // Column URI node

        // Get the prefix (if available)
        let prefix = '';
        if (this.selectedPrefix) {
          prefix = this.selectedPrefix;
        }

        // Get the column name
        let columnName = '';
        if (this.selectedColumn) {
          columnName = this.selectedColumn;
        }

        // Create node condition
        nodeCondition = this.getConditionObject();
        // We determine where to add the node based on the input to the component
        if (this.editedNode && this.parentNode) {
          // Edit existing node
          newNode = new transformationDataModel.ColumnURI(prefix, columnName, nodeCondition, this.editedNode.subElements);
          this.parentNode.replaceChild(this.editedNode, newNode);
          this.transformationSvc.changeTransformationObj(this.transformationObj);
        } else if (this.parentNode && this.siblingNode) {
          // Add a sibling node
          newNode = new transformationDataModel.ColumnURI(prefix, columnName, nodeCondition, null);
          this.parentNode.addNodeAfter(this.siblingNode, newNode);
          this.transformationSvc.changeTransformationObj(this.transformationObj);
        } else if (this.parentNode) {
          // Add node as a child to a node
          newNode = new transformationDataModel.ColumnURI(prefix, columnName, nodeCondition, null);
          this.parentNode.addChild(newNode);
          this.transformationSvc.changeTransformationObj(this.transformationObj);
        }
      } else if (this.selectedSourceType === 'free-defined') {
        // Constant URI node

        let prefix = '';
        let constantURIText = '';
        if (RdfNodeMappingDialogComponent.isProbablyURI(this.nodeIRI)) {
          // Probably a IRI/URI
          constantURIText = this.nodeIRI;
        } else if (RdfNodeMappingDialogComponent.isProbablyQualifiedName(this.nodeIRI)) {
          // Probably a qualified name
          prefix = this.nodeIRI.substring(0, this.nodeIRI.indexOf(':'));
          constantURIText = this.nodeIRI.substring(this.nodeIRI.indexOf(':') + 1);
        }

        // Create node condition
        if (this.nodeConditionChecked) {
          nodeCondition = this.getConditionObject();
        }

        // We determine where to add the node based on the input to the component
        if (this.editedNode && this.parentNode) {
          // Edit existing node
          newNode = new transformationDataModel.ConstantURI(prefix, constantURIText, nodeCondition, this.editedNode.subElements);
          this.parentNode.replaceChild(this.editedNode, newNode);
          this.transformationSvc.changeTransformationObj(this.transformationObj);
        } else if (this.parentNode && this.siblingNode) {
          // Add a sibling node
          newNode = new transformationDataModel.ConstantURI(prefix, constantURIText, nodeCondition, null);
          this.parentNode.addNodeAfter(this.siblingNode, newNode);
          this.transformationSvc.changeTransformationObj(this.transformationObj);
        } else if (this.parentNode) {
          // Add node as a child to a node
          newNode = new transformationDataModel.ConstantURI(prefix, constantURIText, nodeCondition, null);
          this.parentNode.addChild(newNode);
          this.transformationSvc.changeTransformationObj(this.transformationObj);
        }
      }
    } else if (!this.uriNodeTabSelected && this.literalNodeTabSelected && !this.blankNodeSelected) {
      if (this.selectedSourceType === 'dataset-col') {
        // Column Literal node
        const literalText = this.selectedColumn ? this.selectedColumn : '';

        let datatype = null;
        let onEmpty = null;
        let onError = null;
        let langTag = null;
        let datatypeURI = null;
        if (this.assignDataTypeChecked) {
          if (typeof this.selectedDataType === 'number') {
            datatype = this.getDatatypeObject(this.selectedDataType);
          }

          onEmpty = this.valueOnEmpty ? this.valueOnEmpty : '';
          onError = this.valueOnError ? this.valueOnError : '';
          langTag = this.langTag ? this.langTag : '';
          datatypeURI = this.customTypeURI ? this.customTypeURI : '';
        }

        // Create node condition
        if (this.nodeConditionChecked) {
          nodeCondition = this.getConditionObject();
        }

        // We determine where to add the node based on the input to the component
        if (this.editedNode && this.parentNode) {
          // Edit existing node
          newNode = new transformationDataModel.ColumnLiteral(literalText, datatype, onEmpty, onError, langTag, datatypeURI, nodeCondition);
          this.parentNode.replaceChild(this.editedNode, newNode);
          this.transformationSvc.changeTransformationObj(this.transformationObj);
        } else if (this.parentNode && this.siblingNode) {
          // Add a sibling node
          newNode = new transformationDataModel.ColumnLiteral(literalText, datatype, onEmpty, onError, langTag, datatypeURI, nodeCondition);
          this.parentNode.addNodeAfter(this.siblingNode, newNode);
          this.transformationSvc.changeTransformationObj(this.transformationObj);
        } else if (this.parentNode) {
          // Add node as a child to a node
          newNode = new transformationDataModel.ColumnLiteral(literalText, datatype, onEmpty, onError, langTag, datatypeURI, nodeCondition);
          this.parentNode.addChild(newNode);
          this.transformationSvc.changeTransformationObj(this.transformationObj);
        }
      } else if (this.selectedSourceType === 'free-defined') {
        // Constant Literal node

        const literalText = this.literalNodeValue ? this.literalNodeValue : '';

        // Create node condition
        if (this.nodeConditionChecked) {
          nodeCondition = this.getConditionObject();
        }

        // We determine where to add the node based on the input to the component
        if (this.editedNode && this.parentNode) {
          // Edit existing node
          newNode = new transformationDataModel.ConstantLiteral(literalText, nodeCondition);
          this.parentNode.replaceChild(this.editedNode, newNode);
          this.transformationSvc.changeTransformationObj(this.transformationObj);
        } else if (this.parentNode && this.siblingNode) {
          // Add a sibling node
          newNode = new transformationDataModel.ConstantLiteral(literalText, nodeCondition);
          this.parentNode.addNodeAfter(this.siblingNode, newNode);
          this.transformationSvc.changeTransformationObj(this.transformationObj);
        } else if (this.parentNode) {
          // Add node as a child to a node
          newNode = new transformationDataModel.ConstantLiteral(literalText, nodeCondition);
          this.parentNode.addChild(newNode);
          this.transformationSvc.changeTransformationObj(this.transformationObj);
        }
      }
    } else if (!this.uriNodeTabSelected && !this.literalNodeTabSelected && this.blankNodeSelected) {
      // Blank node
      const nodeCondition = {};

      // We determine where to add the node based on the input to the component
      if (this.editedNode && this.parentNode) {
        // Edit existing node
        newNode = new transformationDataModel.BlankNode(nodeCondition, this.editedNode.subElements);
        this.parentNode.replaceChild(this.editedNode, newNode);
        this.transformationSvc.changeTransformationObj(this.transformationObj);
      } else if (this.parentNode && this.siblingNode) {
        // Add a sibling node
        newNode = new transformationDataModel.BlankNode(nodeCondition, []);
        this.parentNode.addNodeAfter(this.siblingNode, newNode);
        this.transformationSvc.changeTransformationObj(this.transformationObj);
      } else if (this.parentNode) {
        // Add node as a child to a node
        newNode = new transformationDataModel.BlankNode(nodeCondition, []);
        this.parentNode.addChild(newNode);
        this.transformationSvc.changeTransformationObj(this.transformationObj);
      }
    }
  }

  ok() {
    this.createAndAddNewNode();
    this.onClickedExit();
  }

  conditionToggleChanged(event) {
    this.nodeConditionChecked = event.checked;
  }

  assignDatatypeToggleChanged(event) {
    this.assignDataTypeChecked = event.checked;
  }

  // Load a node in the dialog
  public loadNode(node, parentNode, siblingNode) {
    this.editedNode = node;
    this.parentNode = parentNode;
    this.siblingNode = siblingNode;
    console.log(node);
    // Select node condition; currently we only view the first condition - we can later add support for more conditions
    if (node.nodeCondition.length > 0) {
      this.loadNodeCondition(node.nodeCondition[0]);
    }
    // load everything in the relevant variables
    switch (node.__type) {
      case 'ColumnURI':
        // Select URI node tab
        this.selectTab('uri');

        // Select source type
        this.selectedSourceType = 'dataset-col';

        // Select prefix
        if (node.prefix) {
          this.selectedPrefix = typeof node.prefix === 'object' ? node.prefix.value : node.prefix;
        }

        // Select column
        if (node.column) {
          this.selectedColumn = typeof node.column === 'object' ? node.column.value : node.column;
        }
        break;
      case 'ConstantURI':
        this.selectTab('uri');
        this.selectedSourceType = 'free-defined';

        // Load constant URI
        if (node.constant) {
          if (node.prefix) {
            this.nodeIRI = node.prefix + ':' + node.constant;
          } else {
            this.nodeIRI = typeof node.constant === 'string' ? node.constant : node.constant.value;
          }

        }

        break;
      case 'ColumnLiteral':
        // Select literal tab
        this.selectTab('literal');
        this.selectedSourceType = 'dataset-col';

        // Load column value
        if (node.literalValue) {
          this.selectedColumn = typeof node.literalValue === 'object' ? node.literalValue.value : node.literalValue;
        }

        // Load datatype value (if any)
        if (node.datatype) {
          if (node.datatype.name) {
            if (!(node.datatype.name === 'unspecified')) {
              this.assignDataTypeChecked = true;
              this.selectedDataType = node.datatype.id;
            }
          }
        }

        // Load value on empty string
        if (node.onEmpty) {
          this.valueOnEmpty = node.onEmpty;
        }

        // Load value on error
        if (node.onError) {
          this.valueOnError = node.onError;
        }

        // Load language tag
        if (node.langTag) {
          this.langTag = node.langTag;
        }

        // Load language tag
        if (node.datatypeURI) {
          this.customTypeURI = node.datatypeURI;
        }
        break;
      case 'ConstantLiteral':
        this.selectTab('literal');
        this.selectedSourceType = 'free-defined';

        if (node.literalValue) {
          this.literalNodeValue = typeof node.literalValue === 'object' ? node.literalValue.value : node.literalValue;
        }

        break;
      case 'BlankNode':
        this.selectTab('blank');
        break;

      default:
        break;
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

    if (typeof nodeCondition.column === 'object') {

    }
  }
}
