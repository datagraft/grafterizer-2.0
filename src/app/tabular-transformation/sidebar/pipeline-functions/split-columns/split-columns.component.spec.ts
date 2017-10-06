import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SplitColumnsComponent } from './split-columns.component';

describe('SplitColumnsComponent', () => {
  let component: SplitColumnsComponent;
  let fixture: ComponentFixture<SplitColumnsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SplitColumnsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SplitColumnsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
