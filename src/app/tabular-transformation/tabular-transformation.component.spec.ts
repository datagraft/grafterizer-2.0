import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TabularTransformationComponent } from './tabular-transformation.component';

describe('TabularTransformationComponent', () => {
  let component: TabularTransformationComponent;
  let fixture: ComponentFixture<TabularTransformationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TabularTransformationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TabularTransformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
