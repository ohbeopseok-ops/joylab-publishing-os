export type VisualUpgradeRules = {
  maxScore: number;
  weights: Record<'traffic'|'dwell'|'ctr'|'internalLink'|'strategicPriority', number>;
  normalization: {
    traffic: { method: 'cohort_max'; cap: number };
    dwell: { method: 'target'; targetSeconds: number; cap: number };
    ctr: { method: 'target'; targetPercent: number; cap: number };
    internalLink: { method: 'target'; targetPercent: number; cap: number };
    strategicPriority: { method: 'percent'; max: number };
  };
  thresholds: { CURATE_NOW: number; QUEUE: number; MONITOR: number };
  dataQuality: { high: number; medium: number; low: number; fallback: string; fallbackStatus: string };
};

export type VisualUpgradeInput = {
  id: string;
  title: string;
  visualMode: 'AUTO-BASELINE'|'CURATED/EXISTING';
  views?: number | null;
  dwellSeconds?: number | null;
  ctrPercent?: number | null;
  internalLinkPercent?: number | null;
  strategicPriority: number;
};

export type VisualUpgradeResult = VisualUpgradeInput & {
  score: number;
  confidence: 'HIGH'|'MEDIUM'|'LOW';
  coverage: number;
  status: 'CURATE_NOW'|'QUEUE'|'MONITOR'|'PROVISIONAL'|'INELIGIBLE';
  reasons: string[];
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const present = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

export function scoreVisualUpgradeQueue(
  rows: VisualUpgradeInput[],
  rules: VisualUpgradeRules
): VisualUpgradeResult[] {
  const eligible = rows.filter((row) => row.visualMode === 'AUTO-BASELINE');
  const maxViews = Math.max(1, ...eligible.map((row) => present(row.views) ? row.views : 0));

  return rows.map((row) => {
    if (row.visualMode !== 'AUTO-BASELINE') {
      return { ...row, score: 0, confidence: 'HIGH', coverage: 1, status: 'INELIGIBLE', reasons: ['이미 CURATED 상태'] };
    }

    const components: Array<{ key: keyof VisualUpgradeRules['weights']; value: number | null; reason: string }> = [
      { key: 'traffic', value: present(row.views) ? clamp01(row.views / maxViews) : null, reason: '조회수' },
      { key: 'dwell', value: present(row.dwellSeconds) ? clamp01(row.dwellSeconds / rules.normalization.dwell.targetSeconds) : null, reason: '체류시간' },
      { key: 'ctr', value: present(row.ctrPercent) ? clamp01(row.ctrPercent / rules.normalization.ctr.targetPercent) : null, reason: '검색 CTR' },
      { key: 'internalLink', value: present(row.internalLinkPercent) ? clamp01(row.internalLinkPercent / rules.normalization.internalLink.targetPercent) : null, reason: '내부링크 유입률' },
      { key: 'strategicPriority', value: clamp01(row.strategicPriority / rules.normalization.strategicPriority.max), reason: '전략 중요도' }
    ];

    const availableWeight = components.reduce((sum, c) => sum + (c.value === null ? 0 : rules.weights[c.key]), 0);
    const weighted = components.reduce((sum, c) => sum + (c.value === null ? 0 : c.value * rules.weights[c.key]), 0);
    const coverage = availableWeight / rules.maxScore;
    const normalized = availableWeight > 0 ? Math.round((weighted / availableWeight) * rules.maxScore) : 0;

    const confidence: VisualUpgradeResult['confidence'] = coverage >= rules.dataQuality.high
      ? 'HIGH'
      : coverage >= rules.dataQuality.medium
        ? 'MEDIUM'
        : 'LOW';

    let status: VisualUpgradeResult['status'];
    if (coverage < rules.dataQuality.medium) status = 'PROVISIONAL';
    else if (normalized >= rules.thresholds.CURATE_NOW) status = 'CURATE_NOW';
    else if (normalized >= rules.thresholds.QUEUE) status = 'QUEUE';
    else status = 'MONITOR';

    const rankedReasons = components
      .filter((c): c is typeof c & { value: number } => c.value !== null)
      .sort((a,b) => (b.value * rules.weights[b.key]) - (a.value * rules.weights[a.key]))
      .slice(0, 3)
      .map((c) => `${c.reason} ${Math.round(c.value * 100)}%`);

    return { ...row, score: normalized, confidence, coverage, status, reasons: rankedReasons };
  }).sort((a,b) => {
    const statusOrder = { CURATE_NOW: 5, QUEUE: 4, PROVISIONAL: 3, MONITOR: 2, INELIGIBLE: 1 } as const;
    return statusOrder[b.status] - statusOrder[a.status] || b.score - a.score || b.strategicPriority - a.strategicPriority;
  });
}
