import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdvPieChartComponent } from './adv-pie-chart.component';

describe('AdvPieChartComponent', () => {
  let component: AdvPieChartComponent;
  let fixture: ComponentFixture<AdvPieChartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdvPieChartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdvPieChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
