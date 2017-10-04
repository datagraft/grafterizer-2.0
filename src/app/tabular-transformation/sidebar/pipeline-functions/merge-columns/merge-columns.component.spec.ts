import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MergeColumnsComponent } from './merge-columns.component';

describe('MergeColumnsComponent', () => {
  let component: MergeColumnsComponent;
  let fixture: ComponentFixture<MergeColumnsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MergeColumnsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MergeColumnsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
