import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CorporateAnalytics } from './analytics';

describe('CorporateAnalytics', () => {
  let component: CorporateAnalytics;
  let fixture: ComponentFixture<CorporateAnalytics>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CorporateAnalytics]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CorporateAnalytics);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
