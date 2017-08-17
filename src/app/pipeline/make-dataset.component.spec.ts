import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MakeDatasetComponent } from './make-dataset.component';

describe('MakeDatasetComponent', () => {
  let component: MakeDatasetComponent;
  let fixture: ComponentFixture<MakeDatasetComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MakeDatasetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MakeDatasetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
