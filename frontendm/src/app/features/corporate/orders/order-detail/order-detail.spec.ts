import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { CorporateOrderDetail } from './order-detail';

describe('CorporateOrderDetail', () => {
  let component: CorporateOrderDetail;
  let fixture: ComponentFixture<CorporateOrderDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CorporateOrderDetail, RouterTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CorporateOrderDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
