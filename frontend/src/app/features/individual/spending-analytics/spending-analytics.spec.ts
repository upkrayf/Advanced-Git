import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpendingAnalytics } from './spending-analytics';

describe('SpendingAnalytics', () => {
  let component: SpendingAnalytics;
  let fixture: ComponentFixture<SpendingAnalytics>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpendingAnalytics]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpendingAnalytics);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
