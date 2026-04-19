import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndividualReviews } from './reviews';

describe('IndividualReviews', () => {
  let component: IndividualReviews;
  let fixture: ComponentFixture<IndividualReviews>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IndividualReviews]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IndividualReviews);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
