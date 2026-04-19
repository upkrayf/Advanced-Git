import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CorporateOrderList } from './order-list';

describe('CorporateOrderList', () => {
  let component: CorporateOrderList;
  let fixture: ComponentFixture<CorporateOrderList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CorporateOrderList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CorporateOrderList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
