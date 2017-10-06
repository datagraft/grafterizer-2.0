import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SortDatasetComponent } from './sort-dataset.component';

describe('SortDatasetComponent', () => {
  let component: SortDatasetComponent;
  let fixture: ComponentFixture<SortDatasetComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SortDatasetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SortDatasetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
