import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlatformAnalytics } from './platform-analytics';

describe('PlatformAnalytics', () => {
  let component: PlatformAnalytics;
  let fixture: ComponentFixture<PlatformAnalytics>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlatformAnalytics]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlatformAnalytics);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
