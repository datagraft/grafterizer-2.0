import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConstantUriNodeComponent } from './constant-uri-node.component';

describe('ConstantUriNodeComponent', () => {
  let component: ConstantUriNodeComponent;
  let fixture: ComponentFixture<ConstantUriNodeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConstantUriNodeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConstantUriNodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
