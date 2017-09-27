import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShiftColumnComponent } from './shift-column.component';

describe('ShiftColumnComponent', () => {
  let component: ShiftColumnComponent;
  let fixture: ComponentFixture<ShiftColumnComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShiftColumnComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShiftColumnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
