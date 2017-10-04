import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReshapeDatasetComponent } from './reshape-dataset.component';

describe('ReshapeDatasetComponent', () => {
  let component: ReshapeDatasetComponent;
  let fixture: ComponentFixture<ReshapeDatasetComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReshapeDatasetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReshapeDatasetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
