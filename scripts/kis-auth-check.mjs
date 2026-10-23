// Manual KIS authentication smoke test. Never logs credentials or token.
const key = process.env.KIS_APP_KEY;
const secret = process.env.KIS_APP_SECRET;
if (!key || !secret) {
  console.error('KIS_AUTH=FAIL; reason=MISSING_SECRET');
  process.exitCode = 1;
} else {
  try {
    const response = await fetch('https://openapi.koreainvestment.com:9443/oauth2/tokenP', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ grant_type: 'client_credentials', appkey: key, appsecret: secret }),
      signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) {
      console.error('KIS_AUTH=FAIL; reason=HTTP_ERROR; status=' + response.status);
      process.exitCode = 1;
    } else {
      const payload = await response.json();
      if (typeof payload.access_token === 'string' && payload.access_token.length > 0) {
        console.log('KIS_AUTH=PASS; token=REDACTED');
      } else {
        console.error('KIS_AUTH=FAIL; reason=TOKEN_MISSING');
        process.exitCode = 1;
      }
    }
  } catch {
    console.error('KIS_AUTH=FAIL; reason=NETWORK_OR_TIMEOUT');
    process.exitCode = 1;
  }
}
