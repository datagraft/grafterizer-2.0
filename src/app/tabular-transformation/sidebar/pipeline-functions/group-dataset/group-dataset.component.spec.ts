import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupDatasetComponent } from './group-dataset.component';

describe('GroupDatasetComponent', () => {
  let component: GroupDatasetComponent;
  let fixture: ComponentFixture<GroupDatasetComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GroupDatasetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupDatasetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
