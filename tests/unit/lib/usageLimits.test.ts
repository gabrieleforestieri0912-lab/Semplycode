import { isPreviousDay, getClientIp } from '@/lib/usageLimits';

describe('isPreviousDay', () => {
  it('returns true for null input', () => {
    expect(isPreviousDay(null)).toBe(true);
  });

  it('returns true for undefined input', () => {
    expect(isPreviousDay(undefined)).toBe(true);
  });

  it('returns true when date is from a previous day', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    expect(isPreviousDay(yesterday)).toBe(true);
  });

  it('returns false when date is today', () => {
    const today = new Date();
    expect(isPreviousDay(today)).toBe(false);
  });
});

describe('getClientIp', () => {
  it('returns x-forwarded-for first value', () => {
    const request = {
      headers: {
        get: (name: string) => {
          if (name === 'x-forwarded-for') return '192.168.1.1, 10.0.0.1';
          return null;
        },
      },
    } as any;

    expect(getClientIp(request)).toBe('192.168.1.1');
  });

  it('returns x-real-ip when x-forwarded-for is absent', () => {
    const request = {
      headers: {
        get: (name: string) => {
          if (name === 'x-real-ip') return '10.0.0.1';
          return null;
        },
      },
    } as any;

    expect(getClientIp(request)).toBe('10.0.0.1');
  });

  it('returns unknown when no ip headers are present', () => {
    const request = {
      headers: {
        get: () => null,
      },
    } as any;

    expect(getClientIp(request)).toBe('unknown');
  });
});
