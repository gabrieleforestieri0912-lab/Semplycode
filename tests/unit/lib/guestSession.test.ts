import { generateGuestId, getOrCreateGuestId, guestCookieHeader, GUEST_COOKIE } from '@/lib/guestSession';

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

describe('generateGuestId', () => {
  it('returns a 32-character hex string', () => {
    const id = generateGuestId();
    expect(id).toHaveLength(32);
    expect(/^[0-9a-f]+$/.test(id)).toBe(true);
  });

  it('generates unique ids', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateGuestId()));
    expect(ids.size).toBe(100);
  });
});

describe('getOrCreateGuestId', () => {
  it('returns existing cookie value', async () => {
    (require('next/headers').cookies as jest.Mock).mockResolvedValue({
      get: () => ({ value: 'existing-guest-id' }),
    });

    const result = await getOrCreateGuestId();
    expect(result).toBe('existing-guest-id');
  });

  it('returns null when cookie does not exist', async () => {
    (require('next/headers').cookies as jest.Mock).mockResolvedValue({
      get: () => undefined,
    });

    const result = await getOrCreateGuestId();
    expect(result).toBeNull();
  });
});

describe('guestCookieHeader', () => {
  it('returns a properly formatted cookie string', () => {
    const header = guestCookieHeader('test-id-123');
    expect(header).toContain('semplycode_guest_id=test-id-123');
    expect(header).toContain('Path=/');
    expect(header).toContain('Max-Age=');
    expect(header).toContain('SameSite=Lax');
    expect(header).toContain('HttpOnly');
  });

  it('matches expected cookie format', () => {
    const header = guestCookieHeader('abc');
    expect(header).toBe('semplycode_guest_id=abc; Path=/; Max-Age=31536000; SameSite=Lax; HttpOnly');
  });
});

describe('GUEST_COOKIE', () => {
  it('is the expected cookie name', () => {
    expect(GUEST_COOKIE).toBe('semplycode_guest_id');
  });
});
