export const SITE_IDENTITY = {
  brand: 'JoyLab',
  domain: 'https://aijoylab.kr',
  publicEmail: 'contact@aijoylab.kr',
  adsense: {
    publisherId: 'pub-6938956176929357',
    clientId: 'ca-pub-6938956176929357',
    adsTxtRecord: 'google.com, pub-6938956176929357, DIRECT, f08c47fec0942fa0'
  },
  channels: {
    youtube: 'https://www.youtube.com/@JoyLabResearch',
    naver: 'https://blog.naver.com/joy014',
    threads: 'https://www.threads.com/@ohbeopseok',
    instagram: 'https://www.instagram.com/aijoylab/',
    linkedin: 'https://www.linkedin.com/in/%EB%B2%95%EC%84%9D-%EC%98%A4-b3273633b/',
    x: 'https://x.com/ohbeopseok'
  }
} as const;

export const OFFICIAL_CHANNELS = [
  { key: 'youtube', label: 'YouTube', href: SITE_IDENTITY.channels.youtube, mark: '▶' },
  { key: 'naver', label: 'Naver Blog', href: SITE_IDENTITY.channels.naver, mark: 'N' },
  { key: 'threads', label: 'Threads', href: SITE_IDENTITY.channels.threads, mark: '@' },
  { key: 'instagram', label: 'Instagram', href: SITE_IDENTITY.channels.instagram, mark: '◎' },
  { key: 'linkedin', label: 'LinkedIn', href: SITE_IDENTITY.channels.linkedin, mark: 'in' },
  { key: 'x', label: 'X', href: SITE_IDENTITY.channels.x, mark: 'X' }
] as const;
