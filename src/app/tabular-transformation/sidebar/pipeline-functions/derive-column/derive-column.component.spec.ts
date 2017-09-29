import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeriveColumnComponent } from './derive-column.component';

describe('DeriveColumnComponent', () => {
  let component: DeriveColumnComponent;
  let fixture: ComponentFixture<DeriveColumnComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeriveColumnComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeriveColumnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
