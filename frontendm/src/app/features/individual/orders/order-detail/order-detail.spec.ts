import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { IndividualOrderDetail } from './order-detail';

describe('IndividualOrderDetail', () => {
  let component: IndividualOrderDetail;
  let fixture: ComponentFixture<IndividualOrderDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IndividualOrderDetail, RouterTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IndividualOrderDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
