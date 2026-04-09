"""
Livora AI — Test Suite
Run: python test_api.py (with the Flask server running on port 8000)
"""
import json
import urllib.request
import urllib.error

BASE = "http://localhost:8000"

def post(path, body):
    data = json.dumps(body).encode()
    req  = urllib.request.Request(f"{BASE}{path}", data=data, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=5) as r:
            return json.loads(r.read()), r.status
    except urllib.error.HTTPError as e:
        return json.loads(e.read()), e.code
    except Exception as e:
        return {"error": str(e)}, 0

def get(path):
    try:
        with urllib.request.urlopen(f"{BASE}{path}", timeout=5) as r:
            return json.loads(r.read()), r.status
    except Exception as e:
        return {"error": str(e)}, 0

def run_tests():
    print("=" * 60)
    print("  🧪 Livora AI Service — Test Suite")
    print("=" * 60)
    passed = failed = 0

    tests = [
        # (name, method, path, body, check_key, expected_value)
        ("Health Check",        "GET",  "/health",  None, "status", "healthy"),
        ("Analyze — Plumbing",  "POST", "/analyze", {"text": "water leakage in bathroom urgent"}, "category", "Plumbing"),
        ("Analyze — Network",   "POST", "/analyze", {"text": "wifi not working since morning"},   "category", "Network"),
        ("Analyze — Electrical","POST", "/analyze", {"text": "fan not working and no electricity"},"category", "Electrical"),
        ("Priority — High",     "POST", "/analyze", {"text": "pipe burst flooding emergency"},    "priority", "High"),
        ("Priority — Low",      "POST", "/analyze", {"text": "minor suggestion for mess menu"},   "priority", "Low"),
        ("Sentiment — Negative","POST", "/sentiment",{"text": "food is terrible and disgusting"}, "sentiment", "negative"),
        ("Sentiment — Positive","POST", "/sentiment",{"text": "wifi improved great service"},     "sentiment", "positive"),
        ("Classify — Security", "POST", "/classify",{"text": "security guard not at gate"},       "category", "Security"),
        ("Fee Prediction",       "POST", "/predict-fee", {"unpaid_semesters": 2, "late_payments": 3, "year": 3, "course_type": 0, "part_time_job": 0, "scholarship": 0}, "riskLevel", None),
        ("Room Allocation",      "POST", "/room-allocation", {
            "students": [{"id": "s1", "name": "Test", "preferences": {"night_owl": 0, "cleanliness_score": 9, "noise_tolerance": 2, "study_hours": 9, "social_score": 2}}],
            "rooms": [{"id": "r1", "number": 101, "type": "Single", "status": "Available"}]
        }, "total", 1),
        ("Empty text error",    "POST", "/analyze", {"text": ""}, "success", False),
        ("Missing key error",   "POST", "/classify", {}, "success", False),
    ]

    for name, method, path, body, check_key, expected in tests:
        resp, code = (post(path, body) if method == "POST" else get(path))
        val        = resp.get(check_key)
        ok         = (val == expected) if expected is not None else (val is not None)
        status     = "✅ PASS" if ok else "❌ FAIL"
        print(f"  {status}  [{code}] {name} → {check_key}={val!r}")
        if ok: passed += 1
        else:  failed += 1

    print(f"\n  Results: {passed} passed / {failed} failed")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
