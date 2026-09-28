import { SITE_IDENTITY } from './siteIdentity';

export const AD_PLACEMENT = {
  enabled: true,
  publisherClientId: SITE_IDENTITY.adsense.clientId,
  slots: {
    articleMid30: { key: 'article-mid-30', slotId: '', minChars: 3200 },
    articleMid65: { key: 'article-mid-65', slotId: '', minChars: 5200 },
    articleEnd: { key: 'article-end', slotId: '1843494813', minChars: 2200 },
    guideEnd: { key: 'guide-end', slotId: '1843494813' },
    archiveInFeed: { key: 'archive-in-feed', slotId: '', minCardsBefore: 6 }
  },
  exclusions: [
    'hero',
    'research-brief',
    'key-takeaways',
    'table',
    'chart',
    'scorecard',
    'primary-cta',
    'contact-cta',
    'navigation'
  ]
} as const;
