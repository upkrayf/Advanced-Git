import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { IndividualProductDetail } from './product-detail';

describe('IndividualProductDetail', () => {
  let component: IndividualProductDetail;
  let fixture: ComponentFixture<IndividualProductDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IndividualProductDetail, RouterTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IndividualProductDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
