/**
 * Limiti funzionali per piano di abbonamento.
 * Usato sia in frontend che backend per applicare realmente le limitazioni.
 */

export type PlanId = 'free' | 'starter' | 'pro' | 'enterprise' | 'guest';

export interface PlanLimits {
  maxFiles: number;               // numero max di file caricati contemporaneamente
  maxCharsPerFile: number;        // lunghezza max per singolo file (caratteri)
  maxTotalChars: number;          // lunghezza totale max input (somma file o editor)
  allowZip: boolean;              // può estrarre ZIP
  allowGithub: boolean;           // può importare da GitHub
  maxChatHistory: number | null;  // numero max di chat salvate (null = illimitato)
  maxNotes: number | null;        // numero max di note salvate
  allowedAnalysisTypes: string[] | 'all'; // tipi di analisi consentiti
  canUseAdvancedModel: boolean;   // modelli avanzati sbloccati
}

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  guest: {
    maxFiles: 1,
    maxCharsPerFile: 8000,
    maxTotalChars: 8000,
    allowZip: false,
    allowGithub: false,
    maxChatHistory: 0,
    maxNotes: 0,
    allowedAnalysisTypes: ['full'],
    canUseAdvancedModel: false,
  },
  free: {
    maxFiles: 1,
    maxCharsPerFile: 10000,
    maxTotalChars: 12000,
    allowZip: false,
    allowGithub: false,
    maxChatHistory: 10,
    maxNotes: 20,
    allowedAnalysisTypes: ['full', 'explain'],
    canUseAdvancedModel: false,
  },
  starter: {
    maxFiles: 3,
    maxCharsPerFile: 30000,
    maxTotalChars: 40000,
    allowZip: false,
    allowGithub: true,
    maxChatHistory: 50,
    maxNotes: 100,
    allowedAnalysisTypes: ['full', 'explain', 'debug', 'optimize'],
    canUseAdvancedModel: false,
  },
  pro: {
    maxFiles: 5,
    maxCharsPerFile: 80000,
    maxTotalChars: 120000,
    allowZip: true,
    allowGithub: true,
    maxChatHistory: 200,
    maxNotes: 500,
    allowedAnalysisTypes: 'all',
    canUseAdvancedModel: true,
  },
  enterprise: {
    maxFiles: 20,
    maxCharsPerFile: 200000,
    maxTotalChars: 500000,
    allowZip: true,
    allowGithub: true,
    maxChatHistory: null,
    maxNotes: null,
    allowedAnalysisTypes: 'all',
    canUseAdvancedModel: true,
  },
};

export function normalizePlan(plan?: string | null): PlanId {
  if (!plan) return 'free';
  const p = plan.toLowerCase().trim();
  if (p === 'guest' || p === 'free' || p === 'starter' || p === 'pro' || p === 'enterprise') return p as PlanId;
  return 'free';
}

export function getPlanLimits(plan?: string | null): PlanLimits {
  return PLAN_LIMITS[normalizePlan(plan)];
}

export function isAnalysisAllowed(plan: string | null | undefined, analysisType: string): boolean {
  const limits = getPlanLimits(plan);
  if (limits.allowedAnalysisTypes === 'all') return true;
  return (limits.allowedAnalysisTypes as string[]).includes(analysisType);
}
