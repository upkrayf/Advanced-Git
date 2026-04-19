import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { CorporateDashboard } from './dashboard';

describe('CorporateDashboard', () => {
  let component: CorporateDashboard;
  let fixture: ComponentFixture<CorporateDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CorporateDashboard, RouterTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CorporateDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
