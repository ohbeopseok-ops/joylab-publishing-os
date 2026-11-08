"""Manual, read-only KIS OAuth/market connectivity smoke.

GitHub Secrets stay in environment variables. Never print token, response body,
request headers, keys or secrets. This is NOT a validated investor-flow feed.
"""
from __future__ import annotations

import json
import os
import sys
import urllib.parse
import urllib.request

HOST = "https://openapi.koreainvestment.com:9443"
TOKEN_PATH = "/oauth2/tokenP"
MARKET_PATH = "/uapi/domestic-stock/v1/quotations/inquire-investor-time-by-market"
QUERY = {"FID_INPUT_ISCD": "999", "FID_INPUT_ISCD_2": "S001"}


def get_json(path: str, *, method: str, headers: dict, body: dict | None = None) -> dict:
    if (path, method) not in {(TOKEN_PATH, "POST"), (MARKET_PATH, "GET")}:
        raise ValueError("API_ALLOWLIST_DENIED")
    url = HOST + path
    if path == MARKET_PATH:
        url += "?" + urllib.parse.urlencode(QUERY)
    payload = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, method=method, data=payload, headers=headers)
    with urllib.request.urlopen(req, timeout=15) as response:
        result = json.load(response)
    if not isinstance(result, dict):
        raise ValueError("NON_OBJECT_PROVIDER_RESPONSE")
    return result


def smoke(*, key: str, secret: str, request=get_json) -> dict:
    """Only return sanitized result flags and KIS response *field names*."""
    if not key or not secret:
        return {"auth": "BLOCKED_SECRETS_MISSING", "readonly_get": "NOT_RUN"}
    token_result = request(
        TOKEN_PATH, method="POST", headers={"content-type": "application/json"},
        body={"grant_type": "client_credentials", "appkey": key, "appsecret": secret},
    )
    token = token_result.get("access_token")
    if not isinstance(token, str) or not token:
        return {"auth": "FAILED", "readonly_get": "NOT_RUN"}
    response = request(
        MARKET_PATH, method="GET",
        headers={"authorization": "Bearer " + token, "appkey": key,
                 "appsecret": secret, "tr_id": "FHPTJ04030000",
                 "content-type": "application/json; charset=utf-8"},
    )
    valid = str(response.get("rt_cd", "")) == "0"
    rows = response.get("output")
    if isinstance(rows, list):
        names = sorted({str(k) for r in rows if isinstance(r, dict) for k in r})
    elif isinstance(rows, dict):
        names = sorted(map(str, rows))
    else:
        names = []
    # A whitelist of metadata names, not any values or credentials.
    return {
        "auth": "PASS", "readonly_get": "PASS" if valid else "FAILED",
        "source": "KIS_READONLY_MARKET_BY_INVESTOR",
        "tr_id": "FHPTJ04030000",
        "output_field_names": names if valid else [],
        "spot_schema": "NOT_VERIFIED", "futures_schema": "NOT_VERIFIED",
        "order_capability": False,
    }


def main() -> int:
    if os.getenv("KIS_SMOKE_ACK") != "true":
        print("SMOKE BLOCKED: manual confirmation of one token request is required")
        return 2
    try:
        result = smoke(key=os.getenv("KIS_APP_KEY", ""),
                       secret=os.getenv("KIS_APP_SECRET", ""))
    except Exception:
        # Never render exception details: HTTP failures may echo request metadata.
        print("KIS_SMOKE_RESULT: AUTH_OR_READONLY_FAILED (details redacted)")
        return 1
    print("KIS_SMOKE_RESULT: " + json.dumps(result, sort_keys=True))
    return 0 if result.get("readonly_get") == "PASS" else 1


if __name__ == "__main__":
    sys.exit(main())
