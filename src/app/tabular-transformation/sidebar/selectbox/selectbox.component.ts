
import { Component, OnInit, Output, Input, EventEmitter, OnDestroy, OnChanges } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { SelectItem } from 'primeng/primeng';
import { ComponentCommunicationService } from '../../component-communication.service';
import { AddRowFunction, DropRowsFunction, ColumnsFunction, MakeDatasetFunction, MapcFunction, KeyFunctionPair, CustomFunctionDeclaration, AddColumnsFunction } from '../../../../assets/transformationdatamodel.js';

@Component({
  moduleId: module.id,
  selector: 'selectbox',
  templateUrl: './selectbox.component.html',
  styleUrls: ['./selectbox.component.css'],
  providers: []
})

export class SelectboxComponent implements OnInit, OnDestroy, OnChanges {
  @Input() suggestions;
  @Input() headers;
  @Input() transformation;
  @Output() emitter = new EventEmitter();

  private function: any;
  private addColumnsFunction: any;
  private addRowFunction: any;
  private makeDatasetFunction: any;
  private dropRowsFunction: any;
  private splitFunction: any;
  private deriveColumnFunction: any;
  private mergeColumnsFunction: any;

  private transformations: SelectItem[];
  private selected: any;
  private modalEnabled: boolean = false;
  private subscription: Subscription;
  private message: any;

  constructor(private componentCommunicationService: ComponentCommunicationService) {
    this.subscription = this.componentCommunicationService.getMessage().subscribe(message => {
      console.log(message)
      if (message.__type == 'AddColumnsFunction') {
        this.addColumnsFunction = message;
        this.selected = { id: message.__type, defaultParams: null };
        this.modalEnabled = true;
      }
      if (message.__type == 'AddRowFunction') {
        this.addRowFunction = message;
        this.selected = { id: message.__type, defaultParams: null };
        this.modalEnabled = true;
      }
      if (message.__type == 'MakeDatasetFunction') {
        this.makeDatasetFunction = message;
        this.selected = { id: message.__type, defaultParams: null };
        this.modalEnabled = true;
      }
      if (message.__type == 'DropRowsFunction') {
        this.dropRowsFunction = message;
        this.selected = { id: message.__type, defaultParams: null };
        this.modalEnabled = true;
      }
      if (message.__type == 'ColumnsFunction') {
        this.dropRowsFunction = message;
        this.selected = { id: message.__type, defaultParams: null };
        this.modalEnabled = true;
      }
      if (message.__type == 'SplitFunction') {
        this.splitFunction = message;
        this.selected = { id: message.__type, defaultParams: null };
        this.modalEnabled = true;
      }
      if (message.__type == 'DeriveColumnFunction') {
        this.deriveColumnFunction = message;
        this.selected = { id: message.__type, defaultParams: null };
        this.modalEnabled = true;
      }
      if (message.__type == 'MergeColumnsFunction') {
        this.mergeColumnsFunction = message;
        this.selected = { id: message.__type, defaultParams: null };
        this.modalEnabled = true;
      }
    });
    this.transformations = [];
    this.selected = { id: null, defaultParams: null };
  }

  ngOnChanges() {
    if (this.suggestions) this.transformations = this.suggestions;
    this.selected = { id: null, defaultParams: null };
    console.log(this.selected);
  }

  ngOnInit() { }

  ngOnDestroy() { this.subscription.unsubscribe(); }

  emitFunction(value: any) {
    this.emitter.emit(value);
  }

  onChange($event) {
    //Functions that don't require additional user input
    switch (this.selected.id) {
      case 'add-row-above':
      case 'add-row-below':
        this.emitFunction(new AddRowFunction(this.selected.defaultParams.position, this.selected.defaultParams.values, ""));
        break;
      case 'make-dataset-header':
        this.emitFunction(new MakeDatasetFunction(
          [], null, undefined, this.selected.defaultParams.moveFirstRowToHeader, null));
        break;
      case 'map-columns-uc':
        this.emitFunction(new MapcFunction(
          this.selected.defaultParams.keyFunctionPairs, null));
        break;
      case 'take-rows-delete':
        this.emitFunction(new DropRowsFunction(
          this.selected.defaultParams.indexFrom, this.selected.defaultParams.indexTo, this.selected.defaultParams.take, null));
        break;
      case 'take-columns-delete':
        this.emitFunction(new ColumnsFunction(
          [this.selected.defaultParams.colToDelete], null, null, false, null));
        break;
      default:
        break;
    }
  }
}
