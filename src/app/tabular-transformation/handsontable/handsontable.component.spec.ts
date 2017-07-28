import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HandsontableComponent } from './handsontable.component';

describe('HandsontableComponent', () => {
  let component: HandsontableComponent;
  let fixture: ComponentFixture<HandsontableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HandsontableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HandsontableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
