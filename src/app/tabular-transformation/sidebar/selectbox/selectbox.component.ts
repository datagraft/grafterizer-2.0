import { Component, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { SelectItem } from 'primeng/primeng';
import { ComponentCommunicationService } from '../../component-communication.service';

@Component({
  moduleId: module.id,
  selector: 'selectbox',
  templateUrl: './selectbox.component.html',
  styleUrls: ['./selectbox.component.css'],
  providers: []
})
export class SelectboxComponent implements OnInit, OnDestroy {

  private transformations: SelectItem[];
  private function: any;
  private selected: String;
  private modalEnabled: boolean = false;

  private message: any;
  private subscription: Subscription;

  @Output() emitter = new EventEmitter();

  constructor(private componentCommunicationService: ComponentCommunicationService) {
    this.subscription = this.componentCommunicationService.getMessage().subscribe(message => {
      this.function = message;
      this.selected = 'make-dataset';
      this.modalEnabled = true;
      console.log(message);
    });
    this.transformations = [];
    this.transformations.push({ label: 'Custom function', value: 'utility-function' });
    this.transformations.push({ label: 'Add row', value: 'add-row' });
    this.transformations.push({ label: 'Add columns', value: 'add-columns' });
    this.transformations.push({ label: 'Deduplicate', value: 'deduplicate' });
    this.transformations.push({ label: 'Derive column', value: 'derive-column' });
    this.transformations.push({ label: 'Filter rows', value: 'filter-rows' });
    this.transformations.push({ label: 'Group and aggregate', value: 'group-dataset' });
    this.transformations.push({ label: 'Make dataset', value: 'make-dataset' });
    this.transformations.push({ label: 'Map columns', value: 'map-columns' });
    this.transformations.push({ label: 'Merge columns', value: 'merge-columns' });
    this.transformations.push({ label: 'Rename columns', value: 'rename-columns' });
    this.transformations.push({ label: 'Reshape dataset', value: 'reshape-dataset' });
    this.transformations.push({ label: 'Shift column', value: 'shift-column' });
    this.transformations.push({ label: 'Shift row', value: 'shift-row' });
    this.transformations.push({ label: 'Sort dataset', value: 'sort-dataset' });
    this.transformations.push({ label: 'Split columns', value: 'split-columns' });
    this.transformations.push({ label: 'Take columns', value: 'take-columns' });
    this.transformations.push({ label: 'Take rows', value: 'take-rows' });
  }

  ngOnInit() { }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  emitFunction(value: any) {
    this.emitter.emit(value);
  }

  onChange($event) {
    this.modalEnabled = true;
  }

}
