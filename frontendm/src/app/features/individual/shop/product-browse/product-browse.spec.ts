import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { ProductBrowse } from './product-browse';

describe('ProductBrowse', () => {
  let component: ProductBrowse;
  let fixture: ComponentFixture<ProductBrowse>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductBrowse, RouterTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductBrowse);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
