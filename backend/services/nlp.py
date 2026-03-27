"""
services/nlp.py
───────────────
NLP pipeline:
  1. Text preprocessing  – lowercase, strip punctuation, remove stopwords
  2. TF-IDF vectorisation of the entire corpus
  3. Cosine-similarity search to find complaints similar to a new one
  4. K-Means clustering to group complaints into themes
  5. Sentiment / urgency scoring via keyword heuristics
"""

from __future__ import annotations
import re
import math
from typing import List, Tuple

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.cluster import KMeans

# ── Stopwords (lightweight; no NLTK download required) ────────────────────────
STOPWORDS = {
    "i","me","my","we","our","you","your","he","she","it","they","them",
    "is","are","was","were","be","been","being","have","has","had","do",
    "does","did","will","would","could","should","may","might","shall",
    "a","an","the","and","but","or","nor","for","so","yet","at","by",
    "in","of","on","to","up","as","if","with","about","from","into",
    "through","during","before","after","above","below","between","this",
    "that","these","those","not","no","very","just","also","too","now",
    "then","there","here","how","what","which","who","whom","when","where",
    "why","all","each","every","both","few","more","most","other","some",
    "such","own","same","than","so","can","us","its","their","been",
}


# ── 1. Preprocessing ──────────────────────────────────────────────────────────

def preprocess(text: str) -> str:
    """Lower-case, remove punctuation, strip stopwords, collapse whitespace."""
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    tokens = [w for w in text.split() if w not in STOPWORDS and len(w) > 1]
    return " ".join(tokens)


# ── 2. TF-IDF helpers ─────────────────────────────────────────────────────────

def build_tfidf(corpus: List[str]) -> Tuple[TfidfVectorizer, np.ndarray]:
    """Fit a TF-IDF vectoriser on `corpus` and return (vectoriser, matrix)."""
    vectorizer = TfidfVectorizer(
        preprocessor=preprocess,
        ngram_range=(1, 2),
        min_df=1,
        sublinear_tf=True,
    )
    matrix = vectorizer.fit_transform(corpus)
    return vectorizer, matrix


# ── 3. Cosine similarity ──────────────────────────────────────────────────────

def find_similar(
    new_text: str,
    corpus: List[str],
    corpus_ids: List[int],
    top_n: int = 5,
    threshold: float = 0.20,
) -> List[int]:
    """
    Return up to `top_n` IDs from `corpus_ids` whose cosine similarity
    to `new_text` is ≥ `threshold`.
    """
    if not corpus:
        return []

    vectorizer, matrix = build_tfidf(corpus)
    query_vec = vectorizer.transform([new_text])
    scores = cosine_similarity(query_vec, matrix).flatten()

    pairs = sorted(
        [(corpus_ids[i], float(scores[i])) for i in range(len(scores))],
        key=lambda x: x[1],
        reverse=True,
    )
    return [cid for cid, score in pairs[:top_n] if score >= threshold]


# ── 4. Clustering ─────────────────────────────────────────────────────────────

def cluster_complaints(texts: List[str], n_clusters: int | None = None) -> List[int]:
    """
    Cluster complaint texts with K-Means.
    Auto-selects k = min(ceil(√n), 8) if n_clusters is not provided.
    Returns a list of integer cluster labels aligned with `texts`.
    """
    n = len(texts)
    if n < 2:
        return [0] * n

    k = n_clusters or min(max(2, math.ceil(math.sqrt(n))), 8)
    k = min(k, n)

    _, matrix = build_tfidf(texts)
    km = KMeans(n_clusters=k, random_state=42, n_init=10)
    labels = km.fit_predict(matrix)
    return labels.tolist()


# ── 5. Urgency / sentiment scoring ───────────────────────────────────────────

# keyword → additive urgency score
_URGENCY_KEYWORDS: dict[str, float] = {
    "urgent":    30, "emergency":  35, "immediately": 30,
    "danger":    28, "dangerous":  28, "hazard":      25,
    "accident":  22, "injured":    30, "injury":      28,
    "death":     40, "dead":       40, "dying":       40,
    "no water":  28, "days":       15, "week":        12,
    "months":    18, "rats":       20, "disease":     25,
    "children":  15, "school":     12, "night":       10,
    "smell":     12, "foul":       15, "overflow":    18,
    "broken":    10, "collapsed":  22, "flooded":     20,
}

_BASE_PRIORITY_SCORE: dict[str, float] = {
    "water":       20, "pothole":    15, "road":       12,
    "garbage":     14, "sewage":     18, "power":      15,
    "electricity": 15, "light":      10, "billing":     8,
}


def score_urgency(text: str) -> float:
    """Return a 0-100 urgency / sentiment score for a complaint."""
    lower = text.lower()
    score: float = 20.0   # baseline

    for kw, pts in _URGENCY_KEYWORDS.items():
        if kw in lower:
            score += pts

    for kw, pts in _BASE_PRIORITY_SCORE.items():
        if kw in lower:
            score += pts

    return min(round(score, 1), 100.0)
