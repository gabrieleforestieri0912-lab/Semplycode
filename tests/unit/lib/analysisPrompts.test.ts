import { buildAnalysisSystemPrompt, ANALYSIS_TYPE_LABELS } from '@/lib/analysisPrompts';

describe('buildAnalysisSystemPrompt', () => {
  it('returns a prompt with default params', () => {
    const prompt = buildAnalysisSystemPrompt({});
    expect(prompt).toContain('Sei un esperto Code Reviewer italiano');
    expect(prompt).toContain('javascript');
    expect(prompt).toContain('## Errori Trovati');
  });

  it('includes analysis type focus', () => {
    const prompt = buildAnalysisSystemPrompt({ analysisType: 'security' });
    expect(prompt).toContain('SICUREZZA');
  });

  it('includes performance focus', () => {
    const prompt = buildAnalysisSystemPrompt({ analysisType: 'performance' });
    expect(prompt).toContain('PERFORMANCE');
  });

  it('includes debug focus', () => {
    const prompt = buildAnalysisSystemPrompt({ analysisType: 'debug' });
    expect(prompt).toContain('DEBUG');
  });

  it('includes line references rule when needed', () => {
    const prompt = buildAnalysisSystemPrompt({ needsLineRefs: true });
    expect(prompt).toContain('riga XX');
  });

  it('includes error context rule when present', () => {
    const prompt = buildAnalysisSystemPrompt({ hasErrorContext: true });
    expect(prompt).toContain('stack trace');
  });

  it('uses provided language', () => {
    const prompt = buildAnalysisSystemPrompt({ lang: 'python' });
    expect(prompt).toContain('```python');
  });

  it('falls back to full analysis type for unknown type', () => {
    const prompt = buildAnalysisSystemPrompt({ analysisType: 'unknown' });
    expect(prompt).toContain('Analisi completa');
  });
});

describe('ANALYSIS_TYPE_LABELS', () => {
  it('has labels for all analysis types', () => {
    expect(ANALYSIS_TYPE_LABELS.full).toBe('Completa');
    expect(ANALYSIS_TYPE_LABELS.security).toBe('Sicurezza');
    expect(ANALYSIS_TYPE_LABELS.performance).toBe('Performance');
    expect(ANALYSIS_TYPE_LABELS.style).toBe('Stile');
    expect(ANALYSIS_TYPE_LABELS.debug).toBe('Debug errore');
  });
});
