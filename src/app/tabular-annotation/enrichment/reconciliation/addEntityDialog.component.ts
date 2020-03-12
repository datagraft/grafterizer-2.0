import {Component, Inject} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';

@Component({
  selector: 'app-add-entity-dialog',
  templateUrl: './addEntityDialog.component.html',
  styleUrls: ['./addEntityDialog.component.css']
})
export class AddEntityDialogComponent {

  addEntityForm: FormGroup;
  identifierSpace: string;

  constructor(public dialogRef: MatDialogRef<AddEntityDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: {'identifierSpace': string}) {
    this.addEntityForm = new FormGroup({
      name: new FormControl('', Validators.required),
      id: new FormControl('', Validators.required)
    });
    this.identifierSpace = data.identifierSpace;
  }

  submit() {
    this.dialogRef.close({
      'name': this.addEntityForm.get('name').value.toString(),
      'id': this.addEntityForm.get('id').value.toString()
    });
  }

}
