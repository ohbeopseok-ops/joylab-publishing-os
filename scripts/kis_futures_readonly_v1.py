"""JoyLab KIS futures read-only probe; no order/account API, no persistence.

Runs only when explicitly acknowledged. Output is sanitized JSON with market
fields, never credentials, access tokens, raw provider responses or headers.
"""
from __future__ import annotations

import json
import os
import re
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

HOST = "https://openapi.koreainvestment.com:9443"
TOKEN = "/oauth2/tokenP"
BOARD = "/uapi/domestic-futureoption/v1/quotations/display-board-futures"
TR_ID = "FHPIF05030200"  # KIS official domestic futures board example.
KST = ZoneInfo("Asia/Seoul")


def _request(path, method, headers, payload=None, params=None):
    if (path, method) not in {(TOKEN, "POST"), (BOARD, "GET")}:
        raise ValueError("API_ALLOWLIST_DENIED")
    url = HOST + path
    if params:
        url += "?" + urllib.parse.urlencode(params)
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(url, headers=headers, method=method, data=data)
    with urllib.request.urlopen(req, timeout=12) as reply:
        result = json.load(reply)
    if not isinstance(result, dict):
        raise ValueError("PROVIDER_SCHEMA_INVALID")
    return result


def _number(value):
    try:
        x = float(str(value).replace(",", ""))
        return x if x == x and abs(x) < 1e12 else None
    except (ValueError, TypeError):
        return None


def normalize_board(result, observed_at):
    """Only explicit provider values, no inferred foreign flows or timestamps."""
    if str(result.get("rt_cd")) != "0":
        return {"status": "DATA_HOLD", "reason": "KIS_PROVIDER_REJECTED"}
    rows = result.get("output")
    if not isinstance(rows, list):
        return {"status": "DATA_HOLD", "reason": "OUTPUT_SCHEMA_UNVERIFIED"}
    sanitized = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        code = str(row.get("futs_shrn_iscd", ""))
        if not re.fullmatch(r"[0-9A-Z]{5,12}", code):
            continue
        price = _number(row.get("futs_prpr"))
        change = _number(row.get("futs_prdy_ctrt"))
        if price is None or price <= 0 or change is None or abs(change) > 30:
            continue
        sanitized.append({"symbol": code, "price": price, "change_pct": change})
    return {
        "status": "DATA_HOLD",  # Price alone never unlocks trading signal.
        "reason": "FOREIGN_FUTURES_NET_FLOW_NOT_VERIFIED",
        "source": "KIS_DOMESTIC_FUTURES_BOARD_REST",
        "observed_at": observed_at,
        "source_market_timestamp": None,
        "rows": sanitized,
        "foreign_futures_net": None,
        "gate": "DATA_HOLD",
        "order_capability": False,
    }


def collect(key, secret, request=_request):
    if not key or not secret:
        return {"status": "DATA_HOLD", "reason": "CREDENTIALS_NOT_AVAILABLE", "gate": "DATA_HOLD"}
    token = request(TOKEN, "POST", {"content-type": "application/json"}, {
        "grant_type": "client_credentials", "appkey": key, "appsecret": secret,
    }).get("access_token")
    if not isinstance(token, str) or not token:
        return {"status": "DATA_HOLD", "reason": "AUTH_FAILED", "gate": "DATA_HOLD"}
    observed = datetime.now(KST).isoformat(timespec="seconds")
    result = request(BOARD, "GET", {
        "authorization": "Bearer " + token, "appkey": key, "appsecret": secret,
        "tr_id": TR_ID, "content-type": "application/json; charset=utf-8",
    }, params={"FID_COND_MRKT_DIV_CODE": "F", "FID_COND_SCR_DIV_CODE": "20503",
               "FID_COND_MRKT_CLS_CODE": "MKI"})
    return normalize_board(result, observed)


def main():
    if os.getenv("KIS_FUTURES_PROBE_ACK") != "true":
        print(json.dumps({"status": "BLOCKED", "reason": "MANUAL_ACK_REQUIRED"}))
        return 2
    try:
        result = collect(os.getenv("KIS_APP_KEY"), os.getenv("KIS_APP_SECRET"))
    except Exception:
        result = {"status": "DATA_HOLD", "reason": "PROVIDER_OR_NETWORK_FAILURE", "gate": "DATA_HOLD"}
    print(json.dumps(result, ensure_ascii=False, sort_keys=True))
    return 0 if result.get("source") else 1


if __name__ == "__main__":
    sys.exit(main())
