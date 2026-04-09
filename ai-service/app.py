"""
Livora AI — Flask Service
Runs on port 8000, provides ML-powered REST endpoints
"""
import os
import time
import logging
from datetime import datetime
from functools import wraps

from flask import Flask, request, jsonify
from flask_cors import CORS

# ── App setup ─────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

# ── Load models ───────────────────────────────────────────────────────────────
from models.registry import registry

# ── Helpers ───────────────────────────────────────────────────────────────────
def success(data: dict, status: int = 200):
    return jsonify({"success": True, **data}), status

def error(message: str, status: int = 400):
    return jsonify({"success": False, "error": message}), status

def require_json(f):
    """Decorator — ensures Content-Type is JSON and body is parseable."""
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not request.is_json:
            return error("Request must be JSON (Content-Type: application/json)")
        if request.json is None:
            return error("Request body is empty or not valid JSON")
        return f(*args, **kwargs)
    return wrapper

def timed(f):
    """Decorator — adds processing_time_ms to response."""
    @wraps(f)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        resp, status = f(*args, **kwargs)
        ms = round((time.perf_counter() - start) * 1000, 1)
        data = resp.get_json()
        data["processing_time_ms"] = ms
        return jsonify(data), status
    return wrapper

# ── Health ────────────────────────────────────────────────────────────────────
@app.route("/", methods=["GET"])
def home():
    return success({
        "service":   "Livora AI Service",
        "version":   "1.0.0",
        "status":    "running",
        "models_loaded": registry.models_loaded,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "endpoints": {
            "analyze":         "POST /analyze",
            "classify":        "POST /classify",
            "sentiment":       "POST /sentiment",
            "predict_fee":     "POST /predict-fee",
            "room_allocation": "POST /room-allocation",
            "health":          "GET  /health",
        }
    })

@app.route("/health", methods=["GET"])
def health():
    return success({
        "status":        "healthy",
        "models_loaded": registry.models_loaded,
        "models": {
            "complaint_classifier": registry.complaint_model is not None,
            "priority_detector":    registry.priority_model is not None,
            "sentiment_analyser":   registry.sentiment_model is not None,
            "room_kmeans":         registry.room_kmeans is not None,
            "fee_predictor":       registry.fee_model is not None,
        },
        "timestamp": datetime.utcnow().isoformat() + "Z",
    })

# ── Main Combined Analyze Endpoint ────────────────────────────────────────────
@app.route("/analyze", methods=["POST"])
@require_json
@timed
def analyze():
    """
    Full complaint analysis — runs category + priority + sentiment in one call.
    Body: { "text": "..." }
    """
    text = request.json.get("text", "").strip()
    if len(text) < 3:
        return error("Text must be at least 3 characters long")

    cat_result  = registry.predict_category(text)
    pri_result  = registry.predict_priority(text)
    sent_result = registry.predict_sentiment(text)

    return success({
        "text":       text[:200],
        "category":   cat_result["category"],
        "priority":   pri_result["priority"],
        "sentiment":  sent_result["sentiment"],
        "confidence": {
            "category":  cat_result["confidence"],
            "priority":  pri_result["confidence"],
            "sentiment": sent_result["confidence"],
        },
        "source": {
            "category":  cat_result["source"],
            "priority":  pri_result["source"],
            "sentiment": sent_result["source"],
        }
    })

# ── Classify Only ─────────────────────────────────────────────────────────────
@app.route("/classify", methods=["POST"])
@require_json
@timed
def classify():
    """
    Complaint category classification only.
    Body: { "text": "..." }
    """
    text = request.json.get("text", "").strip()
    if not text:
        return error("'text' field is required")

    result = registry.predict_category(text)
    return success(result)

# ── Sentiment Only ────────────────────────────────────────────────────────────
@app.route("/sentiment", methods=["POST"])
@require_json
@timed
def sentiment():
    """
    Sentiment analysis only.
    Body: { "text": "..." }
    """
    text = request.json.get("text", "").strip()
    if not text:
        return error("'text' field is required")

    result = registry.predict_sentiment(text)
    return success(result)

# ── Fee Default Prediction ────────────────────────────────────────────────────
@app.route("/predict-fee", methods=["POST"])
@require_json
@timed
def predict_fee():
    """
    Predict if a student will default on fees.
    Body: {
        "unpaid_semesters": int,
        "late_payments":    int,
        "year":             int,
        "course_type":      int (0=UG, 1=PG),
        "part_time_job":    int (0/1),
        "scholarship":      int (0/1)
    }
    """
    data   = request.json
    result = registry.predict_fee_default(data)
    return success(result)

# ── Room Allocation ───────────────────────────────────────────────────────────
@app.route("/room-allocation", methods=["POST"])
@require_json
@timed
def room_allocation():
    """
    Allocate students to room groups using K-Means clustering.
    Body: {
      "students": [
        { "id": "...", "name": "...", "preferences": {
            "night_owl": 0|1,
            "cleanliness_score": 1-10,
            "noise_tolerance":   1-10,
            "study_hours":       1-10,
            "social_score":      1-10
        }}
      ],
      "rooms": [ { "id": "...", "number": 101, "type": "Single", "status": "Available" } ]
    }
    """
    data     = request.json
    students = data.get("students", [])
    rooms    = data.get("rooms", [])

    if not students:
        return error("'students' array is required and must not be empty")

    assignments = []
    group_map   = {0: [], 1: [], 2: []}

    for student in students:
        prefs = student.get("preferences", {})
        feats = [
            int(prefs.get("night_owl", 0)),
            int(prefs.get("cleanliness_score", 5)),
            int(prefs.get("noise_tolerance", 5)),
            int(prefs.get("study_hours", 5)),
            int(prefs.get("social_score", 5)),
        ]
        cluster_result = registry.predict_room_cluster(feats)
        cluster        = cluster_result["cluster"]
        group_map[cluster].append(student.get("id") or student.get("_id"))

        # Try to match with an available room
        available = [r for r in rooms if r.get("status") == "Available"]
        assigned_room = available[len(assignments) % len(available)] if available else None

        assignments.append({
            "studentId":  student.get("id") or student.get("_id"),
            "studentName": student.get("name", "Unknown"),
            "cluster":    cluster,
            "profile":    cluster_result["profile"],
            "source":     cluster_result["source"],
            "roomId":     assigned_room.get("id") or assigned_room.get("_id") if assigned_room else None,
            "roomNumber": assigned_room.get("number") if assigned_room else None,
        })

    profiles = registry.room_meta.get("profiles", ["Study-Focused", "Balanced", "Social"])

    return success({
        "total":       len(assignments),
        "assignments": assignments,
        "groups": {
            profiles[i]: group_map[i] for i in range(3)
        }
    })

# ── Batch Sentiment ───────────────────────────────────────────────────────────
@app.route("/sentiment/batch", methods=["POST"])
@require_json
def sentiment_batch():
    """
    Analyze sentiment of multiple texts at once.
    Body: { "texts": ["...", "..."] }
    """
    texts = request.json.get("texts", [])
    if not texts or not isinstance(texts, list):
        return error("'texts' must be a non-empty list")
    if len(texts) > 50:
        return error("Maximum 50 texts per batch request")

    results = [registry.predict_sentiment(t) for t in texts]
    summary = {
        "positive": sum(1 for r in results if r["sentiment"] == "positive"),
        "negative": sum(1 for r in results if r["sentiment"] == "negative"),
        "neutral":  sum(1 for r in results if r["sentiment"] == "neutral"),
    }
    return success({"count": len(results), "summary": summary, "results": results})

# ── Error handlers ────────────────────────────────────────────────────────────
@app.errorhandler(404)
def not_found(e):
    return error(f"Route not found: {request.method} {request.path}", 404)

@app.errorhandler(405)
def method_not_allowed(e):
    return error(f"Method {request.method} not allowed for {request.path}", 405)

@app.errorhandler(500)
def internal_error(e):
    logger.error(f"Internal error: {e}")
    return error("Internal server error", 500)

# ── Request logging ───────────────────────────────────────────────────────────
@app.before_request
def log_request():
    logger.info(f"→ {request.method} {request.path}")

@app.after_request
def log_response(response):
    logger.info(f"← {response.status_code} {request.path}")
    response.headers["X-Powered-By"] = "Livora-AI"
    return response

# ── Startup ───────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    PORT = int(os.environ.get("PORT", 8000))
    print(f"\n{'='*50}")
    print(f"  🤖 Livora AI Service")
    print(f"  🌍 http://localhost:{PORT}")
    print(f"  📦 Models loaded: {registry.models_loaded}")
    print(f"{'='*50}\n")
    print("  ℹ️  If models are not loaded, run: python train.py\n")
    app.run(host="0.0.0.0", port=PORT, debug=os.environ.get("FLASK_DEBUG", "0") == "1")
