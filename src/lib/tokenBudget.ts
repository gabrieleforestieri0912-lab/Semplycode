/**
 * Budget mensili di token per piano (token = unità stimate usate nella chat AI).
 * `null` = illimitato.
 */
export const PLAN_TOKEN_BUDGETS: Record<string, number | null> = {
  free: 100_000,
  starter: 1_500_000,
  pro: 3_000_000,
  enterprise: null,
};

/** Budget giornaliero di token per gli ospiti (senza account). */
export const GUEST_DAILY_TOKEN_BUDGET = 30_000;

/** Stima: 1 token ≈ 4 caratteri (regola standard). */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}

/** Stima dei token in input a partire dai messaggi della chat. */
export function estimateMessagesTokens(
  messages: { role?: string; content?: string }[],
): number {
  return messages.reduce((sum, m) => sum + estimateTokens(m.content || ''), 0);
}

/** Budget mensile del piano (`null` = illimitato). Fallback: free. */
export function getPlanTokenBudget(plan?: string | null): number | null {
  if (!plan) return PLAN_TOKEN_BUDGETS.free;
  const budget = PLAN_TOKEN_BUDGETS[plan];
  // `null` (enterprise) è un budget valido (illimitato): solo i piani
  // sconosciuti cadono nel fallback free.
  return budget === undefined ? PLAN_TOKEN_BUDGETS.free : budget;
}

/** Il mese (YYYY-MM) di una data ISO. */
export function monthKey(iso?: string | null): string {
  return (iso ? new Date(iso) : new Date()).toISOString().slice(0, 7);
}

/** True se il periodo salvato non corrisponde al mese corrente (o manca). */
export function isNewMonth(periodStart?: string | null): boolean {
  if (!periodStart) return true;
  return monthKey(periodStart) !== monthKey();
}

/** Formatta un numero di token in modo leggibile (es. "100K", "1,5M", "∞"). */
export function formatTokens(tokens: number | null | undefined): string {
  if (tokens == null || tokens === Infinity) return '∞';
  if (tokens >= 1_000_000) {
    const millions = tokens / 1_000_000;
    return `${millions % 1 === 0 ? millions : millions.toFixed(1).replace('.', ',')}M`;
  }
  if (tokens >= 1_000) {
    const thousands = tokens / 1_000;
    return `${thousands % 1 === 0 ? thousands : thousands.toFixed(1).replace('.', ',')}K`;
  }
  return `${tokens}`;
}

/** Residuo (con arrotondamento a intero), utile per le barre di avanzamento. */
export function tokenRatio(used: number, limit: number | null): number {
  if (limit == null || limit <= 0) return 0;
  return Math.min(1, Math.max(0, used / limit));
}

