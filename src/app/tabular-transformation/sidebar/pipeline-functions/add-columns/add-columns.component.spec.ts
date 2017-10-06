import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddColumnsComponent } from './add-columns.component';

describe('AddColumnsComponent', () => {
  let component: AddColumnsComponent;
  let fixture: ComponentFixture<AddColumnsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddColumnsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddColumnsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
