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
      this.selected = this.function.__type
      this.modalEnabled = true;
      console.log(message);
    });
    this.transformations = [];
    this.transformations.push({ label: 'Custom function', value: 'CustomFunction' });
    this.transformations.push({ label: 'Utility function', value: 'UtilityFunction' });
    this.transformations.push({ label: 'Add row', value: 'AddRowFunction' });
    this.transformations.push({ label: 'Add columns', value: 'AddColumnsFunction' });
    this.transformations.push({ label: 'Deduplicate', value: 'RemoveDuplicatesFunction' });
    this.transformations.push({ label: 'Derive column', value: 'DeriveColumnFunction' });
    this.transformations.push({ label: 'Filter rows', value: 'GrepFunction' });
    this.transformations.push({ label: 'Group and aggregate', value: 'GroupRowsFunction' });
    this.transformations.push({ label: 'Make dataset', value: 'MakeDatasetFunction' });
    this.transformations.push({ label: 'Map columns', value: 'MapcFunction' });
    this.transformations.push({ label: 'Merge columns', value: 'MergeColumnsFunction' });
    this.transformations.push({ label: 'Rename columns', value: 'RenameColumnsFunction' });
    this.transformations.push({ label: 'Reshape dataset', value: 'MeltFunction' });
    this.transformations.push({ label: 'Shift column', value: 'ShiftColumnFunction' });
    this.transformations.push({ label: 'Shift row', value: 'ShiftRowFunction' });
    this.transformations.push({ label: 'Sort dataset', value: 'SortDatasetFunction' });
    this.transformations.push({ label: 'Split columns', value: 'SplitFunction' });
    this.transformations.push({ label: 'Take columns', value: 'ColumnsFunction' });
    this.transformations.push({ label: 'Take rows', value: 'DropRowsFunction' });
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
