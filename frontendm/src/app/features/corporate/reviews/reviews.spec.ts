import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CorporateReviews } from './reviews';

describe('CorporateReviews', () => {
  let component: CorporateReviews;
  let fixture: ComponentFixture<CorporateReviews>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CorporateReviews]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CorporateReviews);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
