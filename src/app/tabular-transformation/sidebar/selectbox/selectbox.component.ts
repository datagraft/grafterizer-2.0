import { Component, OnInit } from '@angular/core';
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

  constructor() {
    this.transformations = [];
    this.transformations.push({ label: 'Make dataset', value: 'make-dataset' });
    this.transformations.push({ label: 'Add columns', value: 'add-columns' });
    this.transformations.push({ label: 'Take rows', value: 'take-rows' });
    this.transformations.push({ label: 'Take columns', value: 'take-columns' });
    this.transformations.push({ label: 'Split columns', value: 'split-columns' });
    this.transformations.push({ label: 'Option 4', value: 'Option 4' });
    this.transformations.push({ label: 'Option 5', value: 'Option 5' });
  }

  ngOnInit() { }

  onChange($event) {
    //this.modalEnabled = true;

  }

}
