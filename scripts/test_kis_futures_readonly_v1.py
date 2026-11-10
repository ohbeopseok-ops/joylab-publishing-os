import unittest
from kis_futures_readonly_v1 import collect, normalize_board


class FuturesProbeTests(unittest.TestCase):
    def test_missing_secrets_hold(self):
        self.assertEqual(collect("", "")["gate"], "DATA_HOLD")

    def test_no_foreign_flow_inference(self):
        result = normalize_board({"rt_cd": "0", "output": [{
            "futs_shrn_iscd": "101S12", "futs_prpr": "808.35", "futs_prdy_ctrt": "4.19",
            "access_token": "sensitive",
        }]}, "2026-11-10T10:35:00+09:00")
        self.assertEqual(result["gate"], "DATA_HOLD")
        self.assertIsNone(result["foreign_futures_net"])
        self.assertEqual(result["rows"][0]["price"], 808.35)
        self.assertNotIn("sensitive", str(result))

    def test_schema_and_invalid_rows_hold(self):
        self.assertEqual(normalize_board({"rt_cd": "0", "output": {}}, "now")["status"], "DATA_HOLD")
        self.assertEqual(normalize_board({"rt_cd": "1"}, "now")["reason"], "KIS_PROVIDER_REJECTED")
        result = normalize_board({"rt_cd": "0", "output": [{
            "futs_shrn_iscd": "101S12", "futs_prpr": "0", "futs_prdy_ctrt": "4.1"
        }]}, "now")
        self.assertEqual(result["rows"], [])

    def test_endpoint_allowlist_and_no_order(self):
        calls = []
        def fake(path, method, headers, payload=None, params=None):
            calls.append((path, method))
            if path.endswith("tokenP"):
                return {"access_token": "do-not-log"}
            return {"rt_cd": "0", "output": []}
        result = collect("key", "secret", fake)
        self.assertEqual([x[1] for x in calls], ["POST", "GET"])
        self.assertTrue(all("trading" not in path for path, _ in calls))
        self.assertNotIn("do-not-log", str(result))


if __name__ == "__main__":
    unittest.main()
