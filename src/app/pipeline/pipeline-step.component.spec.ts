import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PipelineStepComponent } from './pipeline-step.component';

describe('PipelineStepComponent', () => {
  let component: PipelineStepComponent;
  let fixture: ComponentFixture<PipelineStepComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PipelineStepComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PipelineStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
