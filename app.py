"""
Smart Crop Recommendation System — Flask backend.

Routes
  GET  /            -> website (3 theme modes: light / dark / eco)
  POST /predict     -> JSON or form data with n,p,k,ph,temp,humidity,rainfall
  GET  /api/crops   -> supported crop list
  GET  /health      -> service status

Uses the trained Random Forest (model/crop_model.pkl) when available and falls
back to the agronomy rule engine otherwise, so the app works out of the box.
"""

import json
import sys
from pathlib import Path

# Ensure emoji/Unicode console output works on Windows (cp1252 default).
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

import numpy as np
from flask import Flask, jsonify, render_template, request

from crop_profiles import CROP_PROFILES, FIELDS

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "model" / "crop_model.pkl"
LABELS_PATH = BASE_DIR / "model" / "crop_names.json"

app = Flask(__name__)

# ---------- Optional ML model ----------
model = None
model_names = []
try:
    import joblib
    if MODEL_PATH.exists():
        model = joblib.load(MODEL_PATH)
        if LABELS_PATH.exists():
            model_names = json.loads(LABELS_PATH.read_text(encoding="utf-8"))
except Exception as exc:  # pragma: no cover - depends on local environment
    print(f"[warn] Could not load ML model: {exc}")


ENGINE = "Random Forest (scikit-learn)" if model is not None else "Agronomy rule engine"


# ---------- Helpers ----------
def parse_inputs(payload):
    values = {}
    for field in FIELDS:
        raw = payload.get(field)
        if raw is None or raw == "":
            raise ValueError(f"Missing value for '{field}'.")
        try:
            values[field] = float(raw)
        except (TypeError, ValueError):
            raise ValueError(f"'{field}' must be a number.")
    if values["ph"] < 0 or values["ph"] > 14:
        raise ValueError("Soil pH must be between 0 and 14.")
    if values["humidity"] < 0 or values["humidity"] > 100:
        raise ValueError("Humidity must be between 0 and 100%.")
    if any(values[f] < 0 for f in ("n", "p", "k", "temp", "rainfall")):
        raise ValueError("Nutrients, temperature and rainfall cannot be negative.")
    return values


def param_score(value, bounds):
    lo, hi = bounds
    if lo <= value <= hi:
        return 1.0
    span = max(hi - lo, 1.0)
    slack = span * 0.55
    distance = lo - value if value < lo else value - hi
    return max(0.0, 1.0 - distance / slack)


def rule_predict(values):
    ranked = []
    for crop in CROP_PROFILES:
        total = 0.0
        for field in FIELDS:
            lo, hi = crop["range"][field]
            span = max(hi - lo, 1.0)
            centre = (lo + hi) / 2
            proximity = np.exp(-2 * ((values[field] - centre) / span) ** 2)
            total += 0.75 * param_score(values[field], (lo, hi)) + 0.25 * proximity
        ranked.append((crop, total / len(FIELDS)))
    ranked.sort(key=lambda item: item[1], reverse=True)

    best, best_score = ranked[0]
    return {
        "crop": best["name"],
        "emoji": best["emoji"],
        "season": best["season"],
        "tip": best["tip"],
        "confidence": int(max(0, min(99, round(58 + best_score * 40)))),
        "model": ENGINE,
        "alternatives": [
            {"crop": c["name"], "confidence": int(max(0, min(96, round(40 + s * 45))))}
            for c, s in ranked[1:4]
        ],
    }


def ml_predict(values):
    import numpy as np
    row = np.array([[values[f] for f in FIELDS]], dtype=float)
    prediction = model.predict(row)[0]
    crop_name = str(prediction)

    confidence = None
    alternatives = []
    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(row)[0]
        classes = list(getattr(model, "classes_", []))
        pairs = []
        for idx, prob in enumerate(probs):
            label = model_names[idx] if idx < len(model_names) else (
                classes[idx] if idx < len(classes) else str(idx)
            )
            pairs.append((str(label), float(prob)))
        pairs.sort(key=lambda p: p[1], reverse=True)
        confidence = int(round(pairs[0][1] * 100)) if pairs else None
        alternatives = [
            {"crop": name, "confidence": int(round(prob * 100))}
            for name, prob in pairs[1:4]
        ]

    profile = next((c for c in CROP_PROFILES if c["name"].lower() == crop_name.lower()), None)
    return {
        "crop": crop_name,
        "emoji": profile["emoji"] if profile else "🌱",
        "season": profile["season"] if profile else "Recommended for your conditions",
        "tip": profile["tip"] if profile else "Match local practices to this crop's needs.",
        "confidence": confidence if confidence is not None else 90,
        "model": ENGINE,
        "alternatives": alternatives,
    }


# ---------- Routes ----------
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/predict", methods=["POST"])
def predict():
    payload = request.get_json(silent=True)
    if payload is None:
        payload = request.form.to_dict()
    try:
        values = parse_inputs(payload)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    try:
        result = ml_predict(values) if model is not None else rule_predict(values)
    except Exception as exc:
        app.logger.exception("Prediction failed, using rule engine")
        result = rule_predict(values)
        result["note"] = f"ML inference unavailable ({exc}); used rule engine."
    return jsonify(result)


@app.route("/api/crops")
def crops():
    return jsonify([
        {"name": c["name"], "emoji": c["emoji"], "season": c["season"], "range": c["range"]}
        for c in CROP_PROFILES
    ])


@app.route("/health")
def health():
    return jsonify({"status": "ok", "engine": ENGINE, "crops": len(CROP_PROFILES)})


@app.errorhandler(404)
def not_found(_error):
    return jsonify({"error": "Endpoint not found"}), 404


if __name__ == "__main__":
    print(f"🌱 Smart Crop Recommendation System | engine: {ENGINE}")
    app.run(host="0.0.0.0", port=5000, debug=True)
