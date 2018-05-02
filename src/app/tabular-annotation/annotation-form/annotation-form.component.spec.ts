import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AnnotationFormComponent } from './annotation-form.component';

describe('AnnotationFormComponent', () => {
  let component: AnnotationFormComponent;
  let fixture: ComponentFixture<AnnotationFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AnnotationFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnnotationFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
