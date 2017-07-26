import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TabularAnnotationComponent } from './tabular-annotation.component';

describe('TabularAnnotationComponent', () => {
  let component: TabularAnnotationComponent;
  let fixture: ComponentFixture<TabularAnnotationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TabularAnnotationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TabularAnnotationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
