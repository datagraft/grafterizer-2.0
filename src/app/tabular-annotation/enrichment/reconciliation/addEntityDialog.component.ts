import
{
  Component,
  Input,
  HostBinding,
  Inject
 } from '@angular/core';
 import {FormControl, Validators} from '@angular/forms';
 import {MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

 export interface dialog_add_entity_data
 {
   name: string;
   link : string;
   score : number;
   matched: boolean;
   set_as_reconciled : boolean;
 }

 export interface DialogData
 {
   dialog_data: dialog_add_entity_data;
 }

 @Component({
   selector: 'addEntityDialog',
   templateUrl: './addEntityDialog.component.html',
   styleUrls: ['./addEntityDialog.component.css']
 })
export class AddEntityDialog  {
  constructor(public dialogRef: MatDialogRef<AddEntityDialog>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) {}

  public myreg = /(^|\s)((https?:\/\/)?[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?)/gi;

  numberFormControl = new FormControl('', [
    Validators.required,
    Validators.min(0),
    Validators.max(1),
    ]);

  nameFormControl = new FormControl('', [
    Validators.required,
    ]);

  linkFormControl = new FormControl('', [
    Validators.required,
    Validators.pattern(this.myreg),
    ]);

}
