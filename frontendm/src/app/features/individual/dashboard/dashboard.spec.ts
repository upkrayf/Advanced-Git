import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { IndividualDashboard } from './dashboard';

describe('IndividualDashboard', () => {
  let component: IndividualDashboard;
  let fixture: ComponentFixture<IndividualDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IndividualDashboard, RouterTestingModule]
    })
      .compileComponents();

    fixture = TestBed.createComponent(IndividualDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
