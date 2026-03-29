"""
services/anomaly_detection.py
────────────────────────────────
ML-based anomaly detection for complaints using Isolation Forest.

Detects:
  - Unusual frequency spikes
  - Unusual patterns per category
  - Unusual sentiment
  - Location clustering
  - Time-based anomalies
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, List
from sqlalchemy.orm import Session
from sklearn.ensemble import IsolationForest
import numpy as np

from models.complaint import ComplaintORM


class AnomalyDetector:
    """ML-based anomaly detection for complaints."""

    def __init__(self, contamination: float = 0.1):
        """
        contamination: Expected proportion of anomalies (0.0-0.5)
        """
        self.model = IsolationForest(contamination=contamination, random_state=42)
        self.is_trained = False

    def train(self, db: Session) -> bool:
        """Train the model on historical complaints."""
        complaints = db.query(ComplaintORM).all()

        if len(complaints) < 10:
            # Not enough data
            return False

        # Extract features
        features = [self._extract_features(c) for c in complaints]

        X = np.array(features)
        self.model.fit(X)
        self.is_trained = True
        return True

    def detect(self, complaint: ComplaintORM, db: Session) -> Dict[str, object]:
        """
        Detect if a complaint is anomalous.

        Returns:
            {
                'is_anomaly': bool,
                'anomaly_score': float (0-1, higher = more anomalous),
                'reasons': List[str],
            }
        """
        if not self.is_trained:
            # Try to train lazily if enough data exists
            self.train(db)

        if not self.is_trained:
            return {'is_anomaly': False, 'anomaly_score': 0.0, 'reasons': []}

        features = np.array([self._extract_features(complaint)])
        anomaly_label = self.model.predict(features)[0]
        anomaly_score = -self.model.score_samples(features)[0]  # Convert to positive

        # Normalize score to 0-1
        anomaly_score = min(1.0, max(0.0, anomaly_score))

        reasons: List[str] = []
        if anomaly_score > 0.6:
            reasons = self._get_anomaly_reasons(complaint, db)

        return {
            'is_anomaly': anomaly_label == -1,  # -1 = anomaly, 1 = normal
            'anomaly_score': float(anomaly_score),
            'reasons': reasons,
        }

    def _extract_features(self, complaint: ComplaintORM) -> List[float]:
        """Extract numerical features from complaint."""
        submitted = complaint.submitted_at

        # 1. Hour of submission (0-23)
        if isinstance(submitted, datetime):
            hour = submitted.hour
        else:
            hour = 12  # Default for date-only values

        # 2. Day of week (0-6)
        day = submitted.weekday() if submitted else 0

        # 3. Sentiment score (0-100)
        sentiment = float(complaint.sentiment) if complaint.sentiment is not None else 50.0

        # 4. Priority encoded (Low=1, Medium=2, High=3, Critical=4)
        priority_map = {'Low': 1, 'Medium': 2, 'High': 3, 'Critical': 4}
        priority = float(priority_map.get(complaint.priority or 'Medium', 2))

        # 5. Is emergency (0 or 1)
        is_emergency = 1.0 if complaint.is_emergency else 0.0

        return [float(hour), float(day), sentiment, priority, is_emergency]

    def _get_anomaly_reasons(self, complaint: ComplaintORM, db: Session) -> List[str]:
        """Determine why a complaint is anomalous."""
        reasons: List[str] = []

        # Check sentiment anomaly
        if complaint.sentiment and complaint.sentiment > 80:
            reasons.append("Very high sentiment score")

        # Check emergency flag with unusual characteristics
        if complaint.is_emergency and complaint.priority != 'Critical':
            reasons.append("Emergency flag but not critical priority")

        # Check if many complaints in the last 24 hours
        recent_complaints = db.query(ComplaintORM).filter(
            ComplaintORM.submitted_at >= (datetime.utcnow() - timedelta(days=1))
        ).count()

        if recent_complaints > 20:
            reasons.append("Unusual frequency spike in last 24 hours")

        # Check category spike
        category_count = db.query(ComplaintORM).filter(
            ComplaintORM.category == complaint.category,
            ComplaintORM.submitted_at >= (datetime.utcnow() - timedelta(days=1))
        ).count()

        if category_count > 5:
            reasons.append(f"Multiple {complaint.category} complaints today")

        # Check location clustering
        location_count = db.query(ComplaintORM).filter(
            ComplaintORM.location == complaint.location,
            ComplaintORM.submitted_at >= (datetime.utcnow() - timedelta(hours=6))
        ).count()

        if location_count > 3:
            reasons.append(f"Multiple complaints from {complaint.location}")

        return reasons[:3]  # Return top 3 reasons


# Global detector instance
_detector = AnomalyDetector()


def train_detector(db: Session) -> bool:
    """Train the detector on historical data."""
    return _detector.train(db)


def detect_anomaly(complaint: ComplaintORM, db: Session) -> Dict[str, object]:
    """Detect if a complaint is anomalous."""
    return _detector.detect(complaint, db)
