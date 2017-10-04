import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TakeRowsComponent } from './take-rows.component';

describe('TakeRowsComponent', () => {
  let component: TakeRowsComponent;
  let fixture: ComponentFixture<TakeRowsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TakeRowsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TakeRowsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
