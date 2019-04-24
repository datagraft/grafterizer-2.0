import
{
  Component,
  Input,
  HostBinding,
  Inject
 } from '@angular/core';

 import {MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';



 @Component({
   selector: 'chooseExtensionOrReconciliationDialog',
   templateUrl: './chooseExtensionOrReconciliationDialog.component.html',
   styleUrls: ['./chooseExtensionOrReconciliationDialog.component.css']
 })
export class ChooseExtensionOrReconciliationDialog  {

  public choose : number = 0;
  constructor(public dialogRef: MatDialogRef<ChooseExtensionOrReconciliationDialog>,
    @Inject(MAT_DIALOG_DATA) public dialogInputData: any) {}

    public submit() {


      this.dialogRef.close({
        'chosen': this.choose
      });
    }




}
