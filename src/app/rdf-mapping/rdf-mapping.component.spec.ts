import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RdfMappingComponent } from './rdf-mapping.component';

describe('RdfMappingComponent', () => {
  let component: RdfMappingComponent;
  let fixture: ComponentFixture<RdfMappingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RdfMappingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RdfMappingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
