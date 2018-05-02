import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RdfNodeMappingDialogComponent } from './rdf-node-mapping-dialog.component';

describe('RdfNodeMappingDialogComponent', () => {
  let component: RdfNodeMappingDialogComponent;
  let fixture: ComponentFixture<RdfNodeMappingDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RdfNodeMappingDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RdfNodeMappingDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
