import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { individualGuard } from './individual-guard';

describe('individualGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => individualGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
