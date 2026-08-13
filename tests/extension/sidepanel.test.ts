function planLabelFromId(plan) {
  if (plan === 'pro') return 'Pro';
  if (plan === 'enterprise') return 'Enterprise';
  if (plan === 'guest') return 'Ospite';
  return 'Gratuito';
}

describe('planLabelFromId', () => {
  it('returns Pro for pro plan', () => {
    expect(planLabelFromId('pro')).toBe('Pro');
  });

  it('returns Enterprise for enterprise plan', () => {
    expect(planLabelFromId('enterprise')).toBe('Enterprise');
  });

  it('returns Ospite for guest plan', () => {
    expect(planLabelFromId('guest')).toBe('Ospite');
  });

  it('returns Gratuito for free plan', () => {
    expect(planLabelFromId('free')).toBe('Gratuito');
  });

  it('returns Gratuito for unknown plan', () => {
    expect(planLabelFromId('unknown')).toBe('Gratuito');
  });
});
