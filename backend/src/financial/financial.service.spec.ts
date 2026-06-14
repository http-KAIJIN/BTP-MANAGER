import { FinancialService } from './financial.service';

describe('FinancialService', () => {
  const service = new FinancialService({} as never);

  it('calculates open commitment status', () => {
    expect(service.calculateCommitmentStatus(100, 0)).toBe('OPEN');
  });

  it('calculates partially paid commitment status', () => {
    expect(service.calculateCommitmentStatus(100, 40)).toBe('PARTIALLY_PAID');
  });

  it('calculates paid commitment status', () => {
    expect(service.calculateCommitmentStatus(100, 100)).toBe('PAID');
  });

  it('calculates overpaid commitment status', () => {
    expect(service.calculateCommitmentStatus(100, 120)).toBe('OVERPAID');
  });
});
