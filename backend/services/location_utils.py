"""
services/location_utils.py
───────────────────────────
Shared utility for mapping location strings to responsible departments.
Used by both the complaint router (auto-assignment on submit) and the seed scripts.
"""

from __future__ import annotations
from typing import Optional


def get_dept_name_for_location(location: str) -> str:
    """
    Return the name of the responsible department for a given campus location string.

    Mapping rules:
      - Canteen           → Canteen
      - Fourth Floor CR1-CR3, Lab 1-4, Staff Room → AIDS
      - Fourth Floor CR4-CR6, Lab 5-8             → AIML
      - Other Fourth Floor spaces                 → Maintenance
      - First Floor                               → CSE
      - Second Floor                              → IT
      - Third Floor                               → IoT
      - Everything else (Ground, Auditorium, Common, etc.) → Maintenance
    """
    loc = location.strip()
    if "Canteen" in loc:
        return "Canteen"
    if "Fourth Floor" in loc:
        room = loc.replace("Fourth Floor - ", "")
        if room in ("CR1", "CR2", "CR3", "Lab 1", "Lab 2", "Lab 3", "Lab 4", "Staff Room"):
            return "AIDS"
        if room in ("CR4", "CR5", "CR6", "Lab 5", "Lab 6", "Lab 7", "Lab 8"):
            return "AIML"
        return "Maintenance"
    if "First Floor" in loc:
        return "CSE"
    if "Second Floor" in loc:
        return "IT"
    if "Third Floor" in loc:
        return "IoT"
    return "Maintenance"