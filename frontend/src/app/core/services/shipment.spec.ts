import { TestBed } from '@angular/core/testing';

import { Shipment } from './shipment';

describe('Shipment', () => {
  let service: Shipment;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Shipment);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
