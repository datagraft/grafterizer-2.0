import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { SelectItem } from 'primeng/primeng';

@Component({
  selector: 'selectbox',
  templateUrl: './selectbox.component.html',
  styleUrls: ['./selectbox.component.css']
})
export class SelectboxComponent implements OnInit {

  private transformations: SelectItem[];
  private selected: String;
  private modalEnabled: boolean = false;

  @Output() emitter = new EventEmitter();

  constructor() {
    this.transformations = [];
    this.transformations.push({ label: 'Make dataset', value: 'make-dataset' });
    this.transformations.push({ label: 'Add columns', value: 'add-columns' });
    this.transformations.push({ label: 'Option 3', value: 'Option 3' });
    this.transformations.push({ label: 'Option 4', value: 'Option 4' });
    this.transformations.push({ label: 'Option 5', value: 'Option 5' });
  }

  ngOnInit() { }

  emitFunction(value: any) {
    this.emitter.emit(value);
  }

  onChange($event) {
    this.modalEnabled = true;
  }

}
