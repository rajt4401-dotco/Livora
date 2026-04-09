"""
Livora AI - Model Trainer
Trains all 5 ML models and saves them to models/saved/
Run: python train.py
"""
import os
import re
import json
import warnings
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, accuracy_score

warnings.filterwarnings("ignore")

BASE_DIR   = Path(__file__).parent
DATA_DIR   = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "models" / "saved"
MODELS_DIR.mkdir(parents=True, exist_ok=True)


def preprocess(text: str) -> str:
    text = str(text).lower().strip()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text


def train_complaint_classifier():
    print("\n[1/5] Training: Complaint Classifier (LogisticRegression + TF-IDF bigrams)")
    df = pd.read_csv(DATA_DIR / "complaints.csv")
    df["text"] = df["text"].apply(preprocess)
    X, y = df["text"], df["category"]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), max_features=5000, sublinear_tf=True)),
        ("clf",   LogisticRegression(max_iter=1000, C=5.0, solver="lbfgs")),
    ])
    pipeline.fit(X_train, y_train)
    preds = pipeline.predict(X_test)
    acc   = accuracy_score(y_test, preds)
    cv    = cross_val_score(pipeline, X, y, cv=5, scoring="accuracy").mean()
    print(f"   Accuracy: {acc:.2%}  |  CV-5 mean: {cv:.2%}")
    print(f"   Classes : {sorted(pipeline.classes_)}")
    print(classification_report(y_test, preds))
    joblib.dump(pipeline, MODELS_DIR / "complaint_classifier.pkl")
    print("   SAVED -> models/saved/complaint_classifier.pkl")
    return pipeline


def train_priority_detector():
    print("\n[2/5] Training: Priority Detector (RandomForest + TF-IDF bigrams)")
    df = pd.read_csv(DATA_DIR / "priority.csv")
    df["text"] = df["text"].apply(preprocess)
    X, y = df["text"], df["priority"]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)
    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), max_features=3000, sublinear_tf=True)),
        ("clf",   RandomForestClassifier(n_estimators=200, random_state=42, class_weight="balanced")),
    ])
    pipeline.fit(X_train, y_train)
    preds = pipeline.predict(X_test)
    acc   = accuracy_score(y_test, preds)
    print(f"   Accuracy: {acc:.2%}")
    print(classification_report(y_test, preds, zero_division=0))
    joblib.dump(pipeline, MODELS_DIR / "priority_detector.pkl")
    print("   SAVED -> models/saved/priority_detector.pkl")
    return pipeline


def train_sentiment_analyser():
    print("\n[3/5] Training: Sentiment Analyser (LogisticRegression + TF-IDF bigrams)")
    df = pd.read_csv(DATA_DIR / "sentiment.csv")
    df["text"] = df["text"].apply(preprocess)
    X, y = df["text"], df["sentiment"]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), max_features=4000, sublinear_tf=True)),
        ("clf",   LogisticRegression(max_iter=1000, C=3.0, solver="lbfgs")),
    ])
    pipeline.fit(X_train, y_train)
    preds = pipeline.predict(X_test)
    acc   = accuracy_score(y_test, preds)
    cv    = cross_val_score(pipeline, X, y, cv=5, scoring="accuracy").mean()
    print(f"   Accuracy: {acc:.2%}  |  CV-5 mean: {cv:.2%}")
    print(classification_report(y_test, preds, zero_division=0))
    meta = {"classes": list(pipeline.classes_)}
    joblib.dump(pipeline, MODELS_DIR / "sentiment_analyser.pkl")
    with open(MODELS_DIR / "sentiment_meta.json", "w") as f:
        json.dump(meta, f)
    print("   SAVED -> models/saved/sentiment_analyser.pkl")
    return pipeline


def train_room_allocator():
    print("\n[4/5] Training: Room Allocator (K-Means Clustering, k=3)")
    df = pd.read_csv(DATA_DIR / "room_allocation.csv")
    features = ["night_owl", "cleanliness_score", "noise_tolerance", "study_hours", "social_score"]
    X = df[features].values
    scaler   = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    k        = 3
    kmeans   = KMeans(n_clusters=k, random_state=42, n_init=10, max_iter=300)
    kmeans.fit(X_scaled)
    labels   = kmeans.labels_
    profiles = ["Study-Focused (Quiet)", "Balanced (Mixed)", "Social (Active)"]
    print(f"   Clusters: {k}")
    for i, profile in enumerate(profiles):
        count = (labels == i).sum()
        print(f"   Cluster {i}: {profile} -> {count} students")
    joblib.dump(kmeans, MODELS_DIR / "room_kmeans.pkl")
    joblib.dump(scaler, MODELS_DIR / "room_scaler.pkl")
    meta = {"k": k, "features": features, "profiles": profiles}
    with open(MODELS_DIR / "room_meta.json", "w") as f:
        json.dump(meta, f)
    print("   SAVED -> models/saved/room_kmeans.pkl + room_scaler.pkl")
    return kmeans, scaler


def train_fee_predictor():
    print("\n[5/5] Training: Fee Default Predictor (RandomForest)")
    df = pd.read_csv(DATA_DIR / "fees.csv")
    features = ["unpaid_semesters", "late_payments", "year", "course_type", "part_time_job", "scholarship"]
    X, y = df[features], df["defaulted"]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)
    model = RandomForestClassifier(n_estimators=100, random_state=42, class_weight="balanced")
    model.fit(X_train, y_train)
    preds = model.predict(X_test)
    acc   = accuracy_score(y_test, preds)
    print(f"   Accuracy: {acc:.2%}")
    print(classification_report(y_test, preds, zero_division=0))
    importances = dict(zip(features, model.feature_importances_.tolist()))
    print(f"   Feature importances: {importances}")
    joblib.dump(model, MODELS_DIR / "fee_predictor.pkl")
    meta = {"features": features, "importances": importances}
    with open(MODELS_DIR / "fee_meta.json", "w") as f:
        json.dump(meta, f)
    print("   SAVED -> models/saved/fee_predictor.pkl")
    return model


if __name__ == "__main__":
    print("=" * 55)
    print("  Livora AI - Model Training Pipeline")
    print("=" * 55)

    complaint_model       = train_complaint_classifier()
    priority_model        = train_priority_detector()
    sentiment_model       = train_sentiment_analyser()
    kmeans_model, scaler  = train_room_allocator()
    fee_model             = train_fee_predictor()

    print("\n" + "=" * 55)
    print("  All models trained and saved successfully!")
    print("  Location: models/saved/")
    print("=" * 55)

    # Quick smoke test
    print("\nSmoke Test:")
    test_texts = [
        "water leakage in bathroom urgent",
        "wifi is not working at all",
        "fan not working in summer heat",
        "food quality is excellent today",
        "room is dirty and unhygienic",
    ]
    for t in test_texts:
        proc = preprocess(t)
        cat  = complaint_model.predict([proc])[0]
        pri  = priority_model.predict([proc])[0]
        sent = sentiment_model.predict([proc])[0]
        print(f"  '{t[:45]}' -> [{cat}] [{pri}] [{sent}]")

    print("\nRun 'python app.py' to start the API server.\n")
