"""
services/rca_service.py
────────────────────────
Root Cause Analysis engine using pattern matching + NLP heuristics.
Completely free and offline — no external API dependencies.
"""

from __future__ import annotations
import re
from typing import Optional


# ── Root cause patterns (issue type → root cause template) ───────────────────
_ROOT_CAUSE_PATTERNS: list[tuple[list[str], str, str]] = [
    (
        ["water cooler", "drinking water", "no water", "dry tap", "water cut"],
        "Water supply disruption or equipment malfunction",
        "Maintenance",
    ),
    (
        ["pipe burst", "pipe leaking", "water pipe", "leakage", "waterlogging", "drainage", "drain blocked"],
        "Plumbing failure or blockage causing water accumulation",
        "Maintenance",
    ),
    (
        ["power cut", "no power", "power outage", "electricity failure", "blackout"],
        "Power supply interruption — possible grid issue or internal wiring fault",
        "Electrical",
    ),
    (
        ["short circuit", "sparks", "switchboard fault", "electric fault"],
        "Electrical fault posing safety hazard — immediate inspection required",
        "Electrical",
    ),
    (
        ["light not working", "tube light", "bulb fused", "no light", "dark corridor"],
        "Lighting fixture failure — bulb/tube replacement or wiring issue",
        "Electrical",
    ),
    (
        ["wifi", "internet not working", "network down", "no internet", "projector not working"],
        "Network or IT equipment failure — switch/router or device malfunction",
        "IT & Network",
    ),
    (
        ["computer not working", "lab pc", "system not working", "server down"],
        "IT hardware or software failure in the computer lab",
        "IT & Network",
    ),
    (
        ["broken chair", "broken bench", "broken desk", "broken door", "broken window",
         "damaged furniture", "cracked floor", "ceiling leak", "broken tile"],
        "Physical infrastructure damage due to wear, overuse, or neglect",
        "Infrastructure",
    ),
    (
        ["garbage", "waste", "trash", "dirty", "unhygienic", "foul smell",
         "rats", "insects", "cockroach", "not clean", "washroom dirty"],
        "Inadequate sanitation or housekeeping — pest/hygiene issue",
        "Housekeeping",
    ),
    (
        ["canteen food", "canteen", "food quality", "food not fresh"],
        "Food quality or hygiene issue in canteen",
        "Facilities",
    ),
    (
        ["ac not working", "air conditioner", "fan not working", "no ventilation"],
        "HVAC/ventilation equipment malfunction or failure",
        "Facilities",
    ),
    (
        ["library", "books", "reading room"],
        "Library resource or facility issue",
        "Facilities",
    ),
]

_DEFAULT_ROOT_CAUSE = "General facility or infrastructure issue requiring departmental review"
_DEFAULT_DEPT       = "Administration"

# ── Severity factor keywords ──────────────────────────────────────────────────
_SEVERITY_FACTORS: list[tuple[list[str], str]] = [
    (["emergency", "urgent", "immediately", "asap"],         "High urgency reported by user"),
    (["injured", "injury", "accident", "hurt"],              "Safety/injury risk present"),
    (["fire", "sparks", "short circuit", "hazard"],          "Fire or electrical safety hazard"),
    (["flood", "flooded", "overflow", "pipe burst"],         "Water damage risk"),
    (["days", "week", "weeks", "since last"],                "Issue has persisted for multiple days"),
    (["multiple", "many students", "everyone", "all students"], "Affects multiple users"),
    (["exam", "class", "lecture", "lab session"],            "Disrupting academic activities"),
    (["children", "kids"],                                   "Vulnerable population affected"),
    (["night", "late evening"],                              "Safety concern during low-visibility hours"),
]


def _extract_severity_factors(text: str) -> list[str]:
    lower = text.lower()
    factors = []
    for keywords, label in _SEVERITY_FACTORS:
        if any(kw in lower for kw in keywords):
            factors.append(label)
    return factors


def analyze_complaint(text: str, category: Optional[str] = None,
                      location: Optional[str] = None) -> dict:
    """
    Perform root cause analysis on a complaint.

    Returns a dict with:
      - root_cause        : str  — primary root cause hypothesis
      - severity_factors  : str  — comma-separated list of aggravating factors
      - recommended_dept  : str  — department that should handle this
      - confidence        : str  — Low / Medium / High
    """
    lower = text.lower()

    # Find matching root cause
    root_cause      = _DEFAULT_ROOT_CAUSE
    recommended_dept = _DEFAULT_DEPT
    matched_count   = 0

    for keywords, cause, dept in _ROOT_CAUSE_PATTERNS:
        if any(kw in lower for kw in keywords):
            root_cause       = cause
            recommended_dept = dept
            matched_count   += 1
            break  # use first (most specific) match

    # Override with category hint if provided
    _CAT_TO_DEPT = {
        "Water & Sanitation":       "Maintenance",
        "Electrical & Power":       "Electrical",
        "Infrastructure & Furniture": "Infrastructure",
        "Cleanliness & Hygiene":    "Housekeeping",
        "Lighting":                 "Electrical",
        "IT & Network":             "IT & Network",
        "Drainage & Plumbing":      "Maintenance",
        "Facilities & Equipment":   "Facilities",
        "General Complaint":        "Administration",
    }
    if category and category in _CAT_TO_DEPT:
        recommended_dept = _CAT_TO_DEPT[category]

    # Severity factors
    factors = _extract_severity_factors(text)

    if location and location not in ("Unknown", ""):
        root_cause = f"{root_cause} — reported at {location}"

    # Confidence: higher when keyword matches + factors found
    if matched_count and len(factors) >= 2:
        confidence = "High"
    elif matched_count or len(factors) >= 1:
        confidence = "Medium"
    else:
        confidence = "Low"

    return {
        "root_cause":       root_cause,
        "severity_factors": "; ".join(factors) if factors else "No critical severity factors identified",
        "recommended_dept": recommended_dept,
        "confidence":       confidence,
    }
