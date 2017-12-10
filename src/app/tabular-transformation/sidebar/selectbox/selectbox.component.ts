
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
  private transformations: SelectItem[];
  private function: any;
  private addColumnsFunction: any;
  private selected: any;
  private modalEnabled: boolean = false;
  @Input() suggestions;
  @Input() headers;
  //passing transformation is needed to access available custom functions
  @Input() transformation;
  private message: any;
  private subscription: Subscription;
  @Output() emitter = new EventEmitter();

  constructor(private componentCommunicationService: ComponentCommunicationService) {
    this.subscription = this.componentCommunicationService.getMessage().subscribe(message => {
      console.log(message)
      if (message.__type == 'AddColumnsFunction') {
        this.addColumnsFunction = message;
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
    console.log(this.function);
    console.log(this.modalEnabled);
    console.log(this.selected);
  }

  ngOnInit() { }

  ngOnDestroy() { this.subscription.unsubscribe(); }

  emitFunction(value: any) {
    this.emitter.emit(value);
    // this.function = null;
    // this.selected = null;
  }

  onChange($event) {
    // console.log(this.function);
    // console.log(this.modalEnabled);

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
