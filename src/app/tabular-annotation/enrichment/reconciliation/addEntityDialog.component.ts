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

  nameFormControl = new FormControl('', [
    Validators.required,
    ]);

  linkFormControl = new FormControl('', [
    Validators.required,
    Validators.pattern(this.myreg),
    ]);

}
