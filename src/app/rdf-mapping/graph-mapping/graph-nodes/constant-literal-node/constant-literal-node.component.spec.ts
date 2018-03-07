import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConstantLiteralNodeComponent } from './constant-literal-node.component';

describe('ConstantLiteralNodeComponent', () => {
  let component: ConstantLiteralNodeComponent;
  let fixture: ComponentFixture<ConstantLiteralNodeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConstantLiteralNodeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConstantLiteralNodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
