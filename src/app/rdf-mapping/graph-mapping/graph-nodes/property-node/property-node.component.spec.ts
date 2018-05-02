import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyNodeComponent } from './property-node.component';

describe('PropertyNodeComponent', () => {
  let component: PropertyNodeComponent;
  let fixture: ComponentFixture<PropertyNodeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PropertyNodeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PropertyNodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
