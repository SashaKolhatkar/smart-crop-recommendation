"""
Dataset generation, model training and testing for the Smart Crop
Recommendation System (README: 'Dataset preprocessing & model training included').

Run:  python test.py

Outputs
  data/Crop_recommendation.csv   synthetic agronomy dataset (22 crops)
  model/crop_model.pkl           trained Random Forest classifier
  model/crop_names.json          class label mapping
"""

import json
import sys
from pathlib import Path

# Ensure emoji/Unicode console output works on Windows (cp1252 default).
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
import joblib

from crop_profiles import CROP_PROFILES, FIELDS

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "data" / "Crop_recommendation.csv"
MODEL_PATH = BASE_DIR / "model" / "crop_model.pkl"
LABELS_PATH = BASE_DIR / "model" / "crop_names.json"

PHYSICAL_BOUNDS = {
    "n": (0, 250), "p": (0, 180), "k": (0, 250), "ph": (3.5, 9.5),
    "temp": (5, 48), "humidity": (20, 100), "rainfall": (20, 400),
}


def generate_dataset(samples_per_crop=150, seed=42):
    """Create a realistic training set from the crop agronomy profiles."""
    rng = np.random.default_rng(seed)
    rows = []
    for crop in CROP_PROFILES:
        for _ in range(samples_per_crop):
            sample = {}
            for field in FIELDS:
                lo, hi = crop["range"][field]
                span = hi - lo
                # Cluster readings around each crop's optimal centre with realistic
                # variance, allowing a small margin outside the band for boundaries.
                centre = (lo + hi) / 2
                value = rng.normal(centre, span * 0.12)
                pmin, pmax = PHYSICAL_BOUNDS[field]
                lower = max(lo - span * 0.10, pmin)
                upper = min(hi + span * 0.10, pmax)
                sample[field] = round(float(np.clip(value, lower, upper)), 2)
            sample["label"] = crop["name"].lower().replace(" ", "")
            rows.append(sample)
    df = pd.DataFrame(rows)
    df = df.sample(frac=1, random_state=seed).reset_index(drop=True)
    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(DATA_PATH, index=False)
    return df


def train(df):
    X = df[FIELDS]
    y = df["label"]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("model", RandomForestClassifier(
            n_estimators=250, max_depth=None, min_samples_leaf=1,
            random_state=42, n_jobs=-1
        )),
    ])
    pipeline.fit(X_train, y_train)
    predictions = pipeline.predict(X_test)
    accuracy = accuracy_score(y_test, predictions)
    print(f"\n✅ Test accuracy: {accuracy * 100:.2f}%\n")
    print(classification_report(y_test, predictions, zero_division=0))

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, MODEL_PATH)
    classes = [str(c) for c in pipeline.classes_]
    LABELS_PATH.write_text(json.dumps(classes, indent=2), encoding="utf-8")
    print(f"💾 Model saved to: {MODEL_PATH}")
    return accuracy


def test_prediction():
    """Quick smoke test mirroring the 'Rice field' sample on the website."""
    if not MODEL_PATH.exists():
        print("⚠️  No trained model found. Run training first.")
        return
    model = joblib.load(MODEL_PATH)
    sample = pd.DataFrame([{
        "n": 90, "p": 45, "k": 50, "ph": 6.5,
        "temp": 28, "humidity": 82, "rainfall": 220,
    }])
    print("🌾 Sample prediction:", model.predict(sample)[0])


if __name__ == "__main__":
    dataset = generate_dataset()
    print(f"📊 Dataset created: {len(dataset)} rows, {dataset['label'].nunique()} crops -> {DATA_PATH}")
    train(dataset)
    test_prediction()
