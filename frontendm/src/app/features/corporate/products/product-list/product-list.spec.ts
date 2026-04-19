import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { CorporateProductList } from './product-list';

describe('CorporateProductList', () => {
  let component: CorporateProductList;
  let fixture: ComponentFixture<CorporateProductList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CorporateProductList, RouterTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CorporateProductList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
