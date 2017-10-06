import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TakeColumnsComponent } from './take-columns.component';

describe('TakeColumnsComponent', () => {
  let component: TakeColumnsComponent;
  let fixture: ComponentFixture<TakeColumnsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TakeColumnsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TakeColumnsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
