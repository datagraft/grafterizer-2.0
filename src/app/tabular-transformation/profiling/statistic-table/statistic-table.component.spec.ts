import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StatisticTableComponent } from './statistic-table.component';

describe('StatisticTableComponent', () => {
  let component: StatisticTableComponent;
  let fixture: ComponentFixture<StatisticTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StatisticTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StatisticTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
