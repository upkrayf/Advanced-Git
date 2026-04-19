import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { CorporateProductDetail } from './product-detail';

describe('CorporateProductDetail', () => {
  let component: CorporateProductDetail;
  let fixture: ComponentFixture<CorporateProductDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CorporateProductDetail, RouterTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CorporateProductDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
