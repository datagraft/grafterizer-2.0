import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ColumnUriNodeComponent } from './column-uri-node.component';

describe('ColumnUriNodeComponent', () => {
  let component: ColumnUriNodeComponent;
  let fixture: ComponentFixture<ColumnUriNodeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ColumnUriNodeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ColumnUriNodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
