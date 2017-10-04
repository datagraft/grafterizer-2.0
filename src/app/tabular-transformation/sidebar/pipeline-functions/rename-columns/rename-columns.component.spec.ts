import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RenameColumnsComponent } from './rename-columns.component';

describe('RenameColumnsComponent', () => {
  let component: RenameColumnsComponent;
  let fixture: ComponentFixture<RenameColumnsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RenameColumnsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RenameColumnsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
