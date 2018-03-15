import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RdfPrefixManagementDialogComponent } from './rdf-prefix-management-dialog.component';

describe('RdfPrefixManagementDialogComponent', () => {
  let component: RdfPrefixManagementDialogComponent;
  let fixture: ComponentFixture<RdfPrefixManagementDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RdfPrefixManagementDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RdfPrefixManagementDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
