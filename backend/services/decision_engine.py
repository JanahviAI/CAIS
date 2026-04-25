"""
services/decision_engine.py
────────────────────────────
Rule-based classifier for SIES GST complaints.
Categories are college-specific.
"""

from __future__ import annotations
from dataclasses import dataclass
import re

_CATEGORY_RULES: list[tuple[list[str], str]] = [
    (["water cooler", "drinking water", "water supply", "no water", "tap",
      "water not", "water cut", "dry tap", "water pipe", "water leaking"],
     "Water & Sanitation"),

    (["power cut", "power outage", "no power", "electricity", "blackout",
      "load shedding", "power failure", "no electricity", "power went",
      "current went", "electric fault", "switchboard", "short circuit"],
     "Electrical & Power"),

    (["broken chair", "broken bench", "broken desk", "broken door",
      "broken window", "broken furniture", "cracked floor", "damaged floor",
      "leaking ceiling", "ceiling leak", "broken tile", "broken step",
      "railing", "broken staircase", "wall damage", "broken infrastructure"],
     "Infrastructure & Furniture"),

    (["garbage", "waste", "trash", "dirty", "unhygienic", "foul smell",
      "smell", "rats", "insects", "cockroach", "dustbin", "litter",
      "sweeping", "cleaning", "not clean", "washroom dirty", "toilet dirty"],
     "Cleanliness & Hygiene"),

    (["light not working", "tube light", "light off", "no light",
      "dark corridor", "dark staircase", "bulb fused", "lamp not working",
      "lighting", "dim light", "flickering light"],
     "Lighting"),

    (["wifi", "internet", "network", "projector", "computer", "lab pc",
      "system not working", "computer not working", "smart board",
      "printer", "scanner", "server down", "lan", "broadband"],
     "IT & Network"),

    (["drain", "drainage", "sewer", "blocked drain", "waterlogging",
      "overflow", "flooded", "water stagnant", "pipe burst", "leakage",
      "water logging"],
     "Drainage & Plumbing"),

    (["ac not working", "air conditioner", "fan not working", "fan broken",
      "ventilation", "canteen food", "canteen", "auditorium", "sports room",
      "sports equipment", "library", "nss", "seminar hall"],
     "Facilities & Equipment"),
]

_DEFAULT_CATEGORY = "General Complaint"

_PRIORITY_THRESHOLDS = [
    (80, "Critical"),
    (60, "High"),
    (40, "Medium"),
    ( 0, "Low"),
]

_ACTIONS: dict[str, str] = {
    "Water & Sanitation":      "Notify the plumbing/maintenance team. Inspect water cooler/tap on the reported floor and restore supply within 24 hours.",
    "Electrical & Power":      "Alert the electrical maintenance team immediately. Inspect switchboard/wiring on reported floor. Do not allow students near the fault.",
    "Infrastructure & Furniture": "Log a maintenance request. Inspect and replace broken furniture or repair structural damage within 48 hours.",
    "Cleanliness & Hygiene":   "Dispatch the housekeeping team to the reported area. Schedule deep cleaning and pest control if required.",
    "Lighting":                "Issue a work order to replace fused tubes/bulbs in the reported corridor or classroom within 24 hours.",
    "IT & Network":            "Notify the IT department. Check network switch/router for the affected floor. Escalate to ISP if network-wide.",
    "Drainage & Plumbing":     "Send the plumbing team to clear the blockage. Arrange for water to be mopped up to prevent accidents.",
    "Facilities & Equipment":  "Inspect the reported facility/equipment. Log a repair or replacement request with the admin office.",
    "General Complaint":       "Log the complaint and route to the relevant department head for review within 24 hours.",
}


@dataclass
class DecisionResult:
    category:         str
    priority:         str
    summary:          str
    suggested_action: str


def classify(text: str, urgency_score: float, is_emergency: bool = False) -> DecisionResult:
    lower = text.lower()

    category = _DEFAULT_CATEGORY
    for patterns, cat in _CATEGORY_RULES:
        if any(p in lower for p in patterns):
            category = cat
            break

    priority = "Low"
    for threshold, label in _PRIORITY_THRESHOLDS:
        if urgency_score >= threshold:
            priority = label
            break

    # Emergency always Critical
    if is_emergency:
        priority = "Critical"

    # Hard-upgrade for dangerous keywords
    _CRITICAL_PHRASES = [
        "short circuit", "sparks", "fire", "injured", "injury",
        "accident", "flood", "pipe burst", "collapse", "emergency"
    ]
    if any(re.search(p, lower) for p in _CRITICAL_PHRASES):
        priority = "Critical"

    words   = [w for w in re.sub(r"[^a-zA-Z0-9 ]", " ", text).split() if len(w) > 2]
    summary = " ".join(words[:12]) + ("…" if len(words) > 12 else "")
    action  = _ACTIONS.get(category, _ACTIONS["General Complaint"])

    return DecisionResult(
        category         = category,
        priority         = priority,
        summary          = summary,
        suggested_action = action,
    )
