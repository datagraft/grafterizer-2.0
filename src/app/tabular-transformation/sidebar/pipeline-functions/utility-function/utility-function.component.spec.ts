import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UtilityFunctionComponent } from './utility-function.component';

describe('UtilityFunctionComponent', () => {
  let component: UtilityFunctionComponent;
  let fixture: ComponentFixture<UtilityFunctionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UtilityFunctionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UtilityFunctionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
