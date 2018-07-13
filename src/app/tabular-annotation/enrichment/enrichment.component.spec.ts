import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EnrichmentComponent } from './enrichment.component';

describe('EnrichmentComponent', () => {
  let component: EnrichmentComponent;
  let fixture: ComponentFixture<EnrichmentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EnrichmentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EnrichmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
