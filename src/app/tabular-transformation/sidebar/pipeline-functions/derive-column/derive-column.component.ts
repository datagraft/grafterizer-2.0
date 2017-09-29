import { Component, OnInit,Input } from '@angular/core';

import { DeriveColumnFunction } from '../../../../../assets/transformationdatamodel.js';

@Component({
  selector: 'derive-column',
  templateUrl: './derive-column.component.html',
  styleUrls: ['./derive-column.component.css']
})
export class DeriveColumnComponent implements OnInit {

  @Input() modalEnabled;
  @Input() function: any;
  @Input() colnames: string[];

  private newColName: string;
  private colsToDeriveFrom;
  private functionsToDeriveWith;
  private docstring:string;

  constructor() { }

  ngOnInit() {
  }

  accept() {
      if (!this.function) {
        
      } else {
       
      }
      console.log(this.function);
      this.modalEnabled = false;
 }


  cancel() {
    this.modalEnabled = false;
  }

}
