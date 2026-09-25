import { SITE_IDENTITY } from './siteIdentity';

export const AD_PLACEMENT = {
  enabled: false,
  publisherClientId: SITE_IDENTITY.adsense.clientId,
  slots: {
    articleMid30: { key: 'article-mid-30', slotId: '', minChars: 3200 },
    articleMid65: { key: 'article-mid-65', slotId: '', minChars: 5200 },
    articleEnd: { key: 'article-end', slotId: '', minChars: 2200 },
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
