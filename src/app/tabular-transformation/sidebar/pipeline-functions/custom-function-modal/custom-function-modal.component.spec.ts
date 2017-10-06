import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomFunctionModalComponent } from './custom-function-modal.component';

describe('CustomFunctionModalComponent', () => {
  let component: CustomFunctionModalComponent;
  let fixture: ComponentFixture<CustomFunctionModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CustomFunctionModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomFunctionModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
