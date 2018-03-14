import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyNodeDialogComponent } from './property-node-dialog.component';

describe('PropertyNodeDialogComponent', () => {
  let component: PropertyNodeDialogComponent;
  let fixture: ComponentFixture<PropertyNodeDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PropertyNodeDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PropertyNodeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
