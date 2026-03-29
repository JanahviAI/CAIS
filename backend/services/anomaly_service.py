"""
services/anomaly_service.py
────────────────────────────
Anomaly detection for complaint volume spikes using scikit-learn Isolation Forest.

Approach:
  1. Aggregate complaints per day.
  2. Build a feature vector (daily count, rolling mean deviation).
  3. Fit an Isolation Forest model and score recent windows.
  4. Flag anomalies when the score indicates unusual activity OR
     when a day's count is > 2× the 7-day rolling average.

Completely free and offline — uses scikit-learn (already in requirements.txt).
"""

from __future__ import annotations
from collections import defaultdict
from datetime import date, timedelta
from typing import List, Optional

import numpy as np
from sklearn.ensemble import IsolationForest

from models.complaint import ComplaintORM


def _build_daily_counts(complaints: list[ComplaintORM]) -> dict[date, int]:
    counts: dict[date, int] = defaultdict(int)
    for c in complaints:
        counts[c.submitted_at] += 1
    return dict(counts)


def _rolling_mean(series: list[float], window: int = 7) -> list[float]:
    result = []
    for i, v in enumerate(series):
        start = max(0, i - window + 1)
        result.append(float(np.mean(series[start:i + 1])))
    return result


def detect_anomalies(complaints: list[ComplaintORM]) -> list[dict]:
    """
    Analyse daily complaint volume and return a list of anomaly records.

    Each anomaly record:
      {
        "date":          str,
        "count":         int,
        "expected":      float,    # 7-day rolling average
        "spike_ratio":   float,    # count / expected
        "severity":      str,      # "Low" | "Medium" | "High"
        "message":       str,
        "isolation_score": float,  # raw IsolationForest score (lower = more anomalous)
      }
    """
    if not complaints:
        return []

    daily_counts = _build_daily_counts(complaints)
    if not daily_counts:
        return []

    # Fill gaps so the time-series is continuous
    min_date = min(daily_counts.keys())
    max_date = max(daily_counts.keys())
    all_dates: list[date] = []
    current = min_date
    while current <= max_date:
        all_dates.append(current)
        current += timedelta(days=1)

    series = [float(daily_counts.get(d, 0)) for d in all_dates]

    if len(series) < 3:
        return []

    rolling = _rolling_mean(series, window=7)

    # Build feature matrix: [count, deviation_from_rolling_mean]
    features = []
    for i, count in enumerate(series):
        mean = rolling[i] if rolling[i] > 0 else 1.0
        deviation = (count - mean) / mean
        features.append([count, deviation])

    X = np.array(features)

    # Fit Isolation Forest — contamination auto-detected
    contamination = min(0.15, max(0.01, 3 / len(X)))
    iso = IsolationForest(n_estimators=100, contamination=contamination,
                          random_state=42)
    iso.fit(X)
    scores = iso.score_samples(X)      # lower (more negative) = more anomalous
    preds  = iso.predict(X)            # -1 = anomaly, 1 = normal

    anomalies = []
    for i, (d, count) in enumerate(zip(all_dates, series)):
        expected   = rolling[i]
        spike_ratio = (count / expected) if expected > 0 else 1.0
        is_iso_anomaly = preds[i] == -1 and count > 0  # only flag non-zero anomalies
        is_spike       = spike_ratio >= 2.0 and count >= 3  # at least 3 complaints

        if not (is_iso_anomaly or is_spike):
            continue

        # Severity
        if spike_ratio >= 4.0 or (is_iso_anomaly and count >= 10):
            severity = "High"
        elif spike_ratio >= 2.5 or (is_iso_anomaly and count >= 5):
            severity = "Medium"
        else:
            severity = "Low"

        anomalies.append({
            "date":            str(d),
            "count":           int(count),
            "expected":        round(expected, 1),
            "spike_ratio":     round(spike_ratio, 2),
            "severity":        severity,
            "message":         (
                f"Unusual complaint volume on {d}: {int(count)} complaints "
                f"({spike_ratio:.1f}× the 7-day average of {expected:.1f})."
            ),
            "isolation_score": round(float(scores[i]), 4),
        })

    return sorted(anomalies, key=lambda x: x["date"], reverse=True)


def detect_category_anomalies(complaints: list[ComplaintORM]) -> list[dict]:
    """
    Detect anomalies per complaint category.
    Flags categories with unusual recent activity.
    """
    if not complaints:
        return []

    # Group by category
    cat_complaints: dict[str, list[ComplaintORM]] = defaultdict(list)
    for c in complaints:
        cat_complaints[c.category or "General Complaint"].append(c)

    results = []
    for category, cat_list in cat_complaints.items():
        anomalies = detect_anomalies(cat_list)
        for a in anomalies:
            a["category"] = category
            a["message"]  = f"[{category}] {a['message']}"
        results.extend(anomalies)

    return sorted(results, key=lambda x: x["date"], reverse=True)
