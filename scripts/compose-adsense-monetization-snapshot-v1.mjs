import fs from 'node:fs';
import path from 'node:path';

const adsensePath=process.env.ADSENSE_METRICS_JSON || 'qa-artifacts/adsense-monetization-gate-v1/adsense.json';
const uxPath=process.env.CLOUDFLARE_UX_JSON || 'qa-artifacts/adsense-monetization-gate-v1/cloudflare-ux.json';
const out=process.env.MONETIZATION_SNAPSHOT_OUT || 'ops/adsense/monetization-snapshot.json';
const stage=process.env.ADSENSE_MONETIZATION_STAGE || 'article-end';

const adsense=JSON.parse(fs.readFileSync(adsensePath,'utf8'));
const ux=JSON.parse(fs.readFileSync(uxPath,'utf8'));

const snapshot={
  schemaVersion:1,
  stage,
  period:adsense.period,
  traffic:{
    eligibleArticlePageviews:adsense.metrics?.pageViews ?? ux.current?.views ?? 0,
    adImpressions:adsense.metrics?.adImpressions ?? 0
  },
  revenue:{
    pageRpmKrw:adsense.metrics?.pageRpmKrw ?? null,
    estimatedEarningsKrw:adsense.metrics?.estimatedEarningsKrw ?? null,
    viewabilityPct:adsense.metrics?.viewabilityPct ?? null,
    fillRatePct:adsense.metrics?.fillRatePct ?? null,
    ctrPct:adsense.metrics?.ctrPct ?? null,
    baselineCtrPct:adsense.baselineMetrics?.ctrPct ?? null
  },
  ux:{
    clsP75:ux.current?.clsP75 ?? null,
    baselineClsP75:ux.baseline?.clsP75 ?? null,
    readingDepthPct:ux.current?.readingDepthPct ?? null,
    baselineReadingDepthPct:ux.baseline?.readingDepthPct ?? null,
    ctaConversionPct:ux.current?.ctaConversionPct ?? null,
    baselineCtaConversionPct:ux.baseline?.ctaConversionPct ?? null,
    exitRatePct:ux.current?.exitRatePct ?? null,
    baselineExitRatePct:ux.baseline?.exitRatePct ?? null,
    pagesPerSession:null,
    baselinePagesPerSession:null
  },
  policy:{
    warning:false,
    consentFailure:false
  },
  layout:{
    adOverlap:false,
    horizontalOverflow:false,
    navigationObstruction:false
  },
  sources:{
    adsense:adsense.source,
    cloudflare:ux.source
  },
  notes:'Policy/CMP/layout booleans are expected to be supplied by production checks or reviewed before ADVANCE.'
};

fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(snapshot,null,2)+'\n');
console.log(JSON.stringify(snapshot,null,2));
