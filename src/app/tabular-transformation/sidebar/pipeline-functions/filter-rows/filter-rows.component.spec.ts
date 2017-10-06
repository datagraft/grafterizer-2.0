import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterRowsComponent } from './filter-rows.component';

describe('FilterRowsComponent', () => {
  let component: FilterRowsComponent;
  let fixture: ComponentFixture<FilterRowsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FilterRowsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FilterRowsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
