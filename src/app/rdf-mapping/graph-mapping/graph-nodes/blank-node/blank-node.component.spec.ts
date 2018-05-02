import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BlankNodeComponent } from './blank-node.component';

describe('BlankNodeComponent', () => {
  let component: BlankNodeComponent;
  let fixture: ComponentFixture<BlankNodeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BlankNodeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BlankNodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
