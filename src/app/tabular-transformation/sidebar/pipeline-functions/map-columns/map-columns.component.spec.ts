import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MapColumnsComponent } from './map-columns.component';

describe('MapColumnsComponent', () => {
  let component: MapColumnsComponent;
  let fixture: ComponentFixture<MapColumnsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MapColumnsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MapColumnsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
