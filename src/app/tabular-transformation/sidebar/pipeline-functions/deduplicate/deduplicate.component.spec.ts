import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeduplicateComponent } from './deduplicate.component';

describe('DeduplicateComponent', () => {
  let component: DeduplicateComponent;
  let fixture: ComponentFixture<DeduplicateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeduplicateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeduplicateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
