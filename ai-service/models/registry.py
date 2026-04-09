"""
Livora AI — Model Registry
Loads trained models once at startup and provides prediction functions
"""
import re
import json
import logging
import numpy as np
import joblib
from pathlib import Path

logger = logging.getLogger(__name__)

MODELS_DIR = Path(__file__).parent.parent / "models" / "saved"

# ── Keyword fallback classifier ───────────────────────────────────────────────
CATEGORY_KEYWORDS = {
    "Plumbing":     ["water", "pipe", "leak", "drain", "tap", "flush", "toilet", "sink"],
    "Network":      ["wifi", "internet", "network", "connection", "router", "broadband"],
    "Electrical":   ["light", "fan", "ac", "switch", "power", "electricity", "fuse", "socket", "short", "circuit", "shock", "wire"],
    "Emergency":    ["fire", "smoke", "accident", "emergency", "medical", "ambulance", "hospital", "injury", "bleeding", "hurt", "unconscious", "burning", "gas leak"],
    "Mess":         ["food", "mess", "meal", "canteen", "breakfast", "lunch", "dinner", "cook"],

    "Furniture":    ["chair", "table", "bed", "cupboard", "wardrobe", "desk", "mattress"],
    "Housekeeping": ["clean", "dirty", "sweep", "mop", "garbage", "trash", "dust"],
    "Noise":        ["noise", "loud", "sound", "music", "disturb", "party"],
    "Security":     ["security", "lock", "gate", "cctv", "theft", "key", "guard"],
}

PRIORITY_KEYWORDS = {
    "High":   ["urgent", "emergency", "danger", "flood", "fire", "burst", "severe", "critical", "serious", "immediately", "shock", "sparks", "flooding", "overflowing", "short", "circuit", "burning", "smoke"],
    "Low":    ["suggestion", "request", "minor", "slight", "improve", "feedback", "small", "sometime"],
}

SENTIMENT_POSITIVE = ["good", "great", "excellent", "improved", "happy", "satisfied", "clean", "nice", "better", "helpful", "thank", "wonderful", "appreciate", "fast", "efficient"]
SENTIMENT_NEGATIVE = ["bad", "broke", "broken", "dirty", "not working", "leaking", "problem", "issue", "terrible", "worst", "disgusting", "urgent", "failed", "awful", "horrible", "frustrated"]


def _preprocess(text: str) -> str:
    text = str(text).lower().strip()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text


def _keyword_classify(text: str) -> str:
    t = _preprocess(text)
    scores = {cat: sum(1 for kw in kws if kw in t) for cat, kws in CATEGORY_KEYWORDS.items()}
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "General"


def _keyword_priority(text: str) -> str:
    t = _preprocess(text)
    if any(kw in t for kw in PRIORITY_KEYWORDS["High"]):
        return "High"
    if any(kw in t for kw in PRIORITY_KEYWORDS["Low"]):
        return "Low"
    return "Medium"


def _keyword_sentiment(text: str) -> tuple:
    t = _preprocess(text)
    pos = sum(1 for w in SENTIMENT_POSITIVE if w in t)
    neg = sum(1 for w in SENTIMENT_NEGATIVE if w in t)
    if pos > neg:
        return "positive", round(pos / (pos + neg + 1), 2)
    elif neg > pos:
        return "negative", round(neg / (pos + neg + 1), 2)
    return "neutral", 0.5


# ── Model Registry ────────────────────────────────────────────────────────────
class ModelRegistry:
    def __init__(self):
        self.complaint_model  = None
        self.priority_model   = None
        self.sentiment_model  = None
        self.room_kmeans      = None
        self.room_scaler      = None
        self.fee_model        = None
        self.room_meta        = {}
        self.models_loaded    = False
        self.load_all()

    def load_all(self):
        """Attempt to load all saved models. Gracefully falls back to keywords if unavailable."""
        loaded = []
        failed = []

        def _load(name, path):
            try:
                obj = joblib.load(path)
                loaded.append(name)
                return obj
            except Exception as e:
                failed.append(name)
                logger.warning(f"⚠️  Could not load {name}: {e} — using fallback")
                return None

        self.complaint_model = _load("complaint_classifier", MODELS_DIR / "complaint_classifier.pkl")
        self.priority_model  = _load("priority_detector",    MODELS_DIR / "priority_detector.pkl")
        self.sentiment_model = _load("sentiment_analyser",   MODELS_DIR / "sentiment_analyser.pkl")
        self.room_kmeans     = _load("room_kmeans",          MODELS_DIR / "room_kmeans.pkl")
        self.room_scaler     = _load("room_scaler",          MODELS_DIR / "room_scaler.pkl")
        self.fee_model       = _load("fee_predictor",        MODELS_DIR / "fee_predictor.pkl")

        try:
            with open(MODELS_DIR / "room_meta.json") as f:
                self.room_meta = json.load(f)
        except Exception:
            self.room_meta = {"k": 3, "profiles": ["Study-Focused (Quiet)", "Balanced (Mixed)", "Social (Active)"]}

        self.models_loaded = len(loaded) > 0
        logger.info(f"✅ Models loaded: {loaded}")
        if failed:
            logger.warning(f"⚠️  Models using fallback: {failed} — run python train.py to train them")

    # ── Predictions ──────────────────────────────────────────────────────────

    def predict_category(self, text: str) -> dict:
        proc = _preprocess(text)
        if self.complaint_model:
            try:
                category   = self.complaint_model.predict([proc])[0]
                proba      = self.complaint_model.predict_proba([proc])[0]
                confidence = float(max(proba))
                return {"category": category, "confidence": round(confidence, 3), "source": "ml"}
            except Exception as e:
                logger.warning(f"Complaint model error: {e}")
        category = _keyword_classify(text)
        return {"category": category, "confidence": 0.65, "source": "fallback"}

    def predict_priority(self, text: str) -> dict:
        proc = _preprocess(text)
        if self.priority_model:
            try:
                priority   = self.priority_model.predict([proc])[0]
                proba      = self.priority_model.predict_proba([proc])[0]
                confidence = float(max(proba))
                return {"priority": priority, "confidence": round(confidence, 3), "source": "ml"}
            except Exception as e:
                logger.warning(f"Priority model error: {e}")
        priority = _keyword_priority(text)
        return {"priority": priority, "confidence": 0.6, "source": "fallback"}

    def predict_sentiment(self, text: str) -> dict:
        proc = _preprocess(text)
        if self.sentiment_model:
            try:
                sentiment  = self.sentiment_model.predict([proc])[0]
                proba      = self.sentiment_model.predict_proba([proc])[0]
                confidence = float(max(proba))
                return {"sentiment": sentiment, "confidence": round(confidence, 3), "source": "ml"}
            except Exception as e:
                logger.warning(f"Sentiment model error: {e}")
        sentiment, score = _keyword_sentiment(text)
        return {"sentiment": sentiment, "confidence": score, "source": "fallback"}

    def predict_room_cluster(self, features: list) -> dict:
        """features = [night_owl, cleanliness, noise_tolerance, study_hours, social_score]"""
        if self.room_kmeans and self.room_scaler:
            try:
                arr     = np.array(features).reshape(1, -1)
                scaled  = self.room_scaler.transform(arr)
                cluster = int(self.room_kmeans.predict(scaled)[0])
                profiles = self.room_meta.get("profiles", ["Quiet", "Balanced", "Social"])
                return {"cluster": cluster, "profile": profiles[cluster], "source": "ml"}
            except Exception as e:
                logger.warning(f"Room model error: {e}")
        # Fallback heuristic
        noise_tolerance = features[2] if len(features) > 2 else 5
        social_score    = features[4] if len(features) > 4 else 5
        if noise_tolerance < 4 and social_score < 4:
            return {"cluster": 0, "profile": "Study-Focused (Quiet)", "source": "fallback"}
        elif noise_tolerance > 7 and social_score > 7:
            return {"cluster": 2, "profile": "Social (Active)", "source": "fallback"}
        return {"cluster": 1, "profile": "Balanced (Mixed)", "source": "fallback"}

    def predict_fee_default(self, features: dict) -> dict:
        """features = {unpaid_semesters, late_payments, year, course_type, part_time_job, scholarship}"""
        if self.fee_model:
            try:
                feat_order = ["unpaid_semesters", "late_payments", "year", "course_type", "part_time_job", "scholarship"]
                arr        = np.array([[features.get(f, 0) for f in feat_order]])
                prediction = int(self.fee_model.predict(arr)[0])
                proba      = self.fee_model.predict_proba(arr)[0]
                prob_default = float(proba[1])
                risk = "High" if prob_default > 0.65 else ("Medium" if prob_default > 0.35 else "Low")
                return {"defaulted": bool(prediction), "probability": round(prob_default, 3), "riskLevel": risk, "source": "ml"}
            except Exception as e:
                logger.warning(f"Fee model error: {e}")
        # Fallback heuristic
        unpaid = features.get("unpaid_semesters", 0)
        late   = features.get("late_payments", 0)
        risk   = "High" if unpaid > 1 or late > 3 else ("Medium" if unpaid == 1 or late > 1 else "Low")
        prob   = min(0.9, (unpaid * 0.3 + late * 0.1))
        return {"defaulted": risk == "High", "probability": round(prob, 3), "riskLevel": risk, "source": "fallback"}


# Singleton registry
registry = ModelRegistry()
