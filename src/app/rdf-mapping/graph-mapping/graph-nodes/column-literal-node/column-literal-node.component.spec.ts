import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ColumnLiteralNodeComponent } from './column-literal-node.component';

describe('ColumnLiteralNodeComponent', () => {
  let component: ColumnLiteralNodeComponent;
  let fixture: ComponentFixture<ColumnLiteralNodeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ColumnLiteralNodeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ColumnLiteralNodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
