import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShiftRowComponent } from './shift-row.component';

describe('ShiftRowComponent', () => {
  let component: ShiftRowComponent;
  let fixture: ComponentFixture<ShiftRowComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShiftRowComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShiftRowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
