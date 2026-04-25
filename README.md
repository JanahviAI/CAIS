# Complaint → Action Intelligence System (CAIS)

A full-stack web application that converts raw user complaints into actionable insights using NLP processing, rule-based classification, TF-IDF cosine similarity, and K-Means clustering.

---

## Project Structure

```
cais/
├── backend/                        # FastAPI server
│   ├── main.py                     # App entry point, CORS, router registration
│   ├── seed.py                     # One-time demo data seeder
│   ├── requirements.txt
│   ├── cais.db                     # SQLite DB (auto-created on first run)
│   ├── db/
│   │   └── database.py             # SQLAlchemy engine + session + get_db()
│   ├── models/
│   │   └── complaint.py            # ORM table + Pydantic schemas
│   ├── routers/
│   │   ├── auth.py                 # POST /api/auth/login
│   │   ├── complaints.py           # CRUD /api/complaints/
│   │   └── analytics.py            # GET  /api/analytics/stats|clusters
│   └── services/
│       ├── nlp.py                  # Preprocessing, TF-IDF, cosine similarity, K-Means, urgency scoring
│       ├── decision_engine.py      # Rule-based category / priority / action classifier
│       └── complaint_service.py    # Orchestration layer (NLP + engine + DB)
│
└── frontend/                       # React application
    ├── package.json
    ├── public/
    │   └── index.html
    └── src/
        ├── index.js
        ├── App.jsx                 # Root component + auth routing
        ├── services/
        │   └── api.js              # All Axios calls to backend
        ├── hooks/
        │   ├── useComplaints.js    # Complaint list state + API
        │   └── useStats.js         # Analytics stats state + API
        ├── data/
        │   └── constants.js        # Colour maps, chart palette
        └── components/
            ├── LoginPage.jsx
            ├── common/
            │   ├── Navbar.jsx
            │   ├── Pill.jsx
            │   ├── ChartCard.jsx
            │   ├── Spinner.jsx
            │   └── ErrorBanner.jsx
            ├── user/
            │   ├── UserDashboard.jsx
            │   ├── ComplaintForm.jsx
            │   └── ComplaintList.jsx
            └── admin/
                ├── AdminDashboard.jsx
                ├── OverviewTab.jsx
                ├── AnalyticsCharts.jsx
                ├── Dashboard.jsx
                └── InsightsTab.jsx
```

---

## Prerequisites

| Tool    | Version   |
|---------|-----------|
| Python  | 3.10+     |
| Node.js | 18+       |
| npm     | 9+        |

---

## Setup & Run

### 1 — Clone / unzip the project

```bash
unzip cais.zip
cd cais
```

---

### 2 — Backend

```bash
cd backend

# Create a virtual environment (recommended)
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server (auto-seeds DB on first run)
uvicorn main:app --reload --port 8000
```

The API is now live at **http://localhost:8000**
Interactive docs: **http://localhost:8000/docs**

> The database file `cais.db` is created automatically in the `backend/` folder.
> Demo data (15 complaints) is seeded on first startup.

---

### 3 — Frontend

Open a **second terminal**:

```bash
cd frontend

npm install
npm start
```

The React app opens at **http://localhost:3000**
All `/api/*` requests are proxied to `http://localhost:8000` via the `"proxy"` field in `package.json`.

---

## Login Credentials

| Role    | Username | Password  |
|---------|----------|-----------|
| Citizen | user     | user123   |
| Admin   | admin    | admin123  |

---

## API Endpoints

### Auth
| Method | Path              | Description              |
|--------|-------------------|--------------------------|
| POST   | /api/auth/login   | Returns role + user info |

### Complaints
| Method | Path                      | Description                              |
|--------|---------------------------|------------------------------------------|
| POST   | /api/complaints/          | Submit complaint (runs full NLP pipeline)|
| GET    | /api/complaints/          | List all; filter by user_id/status/priority |
| GET    | /api/complaints/{id}      | Single complaint                         |
| PATCH  | /api/complaints/{id}      | Update status / action_taken             |

### Analytics
| Method | Path                      | Description                              |
|--------|---------------------------|------------------------------------------|
| GET    | /api/analytics/stats      | KPI counts + chart data arrays           |
| GET    | /api/analytics/clusters   | Complaints grouped by NLP cluster        |

---

## NLP Pipeline

```
Raw complaint text
        │
        ▼
  Preprocessing          lowercase, remove punctuation, strip stopwords
        │
        ▼
  Urgency Scoring        keyword heuristic → 0–100 score
        │
        ▼
  Rule Engine            category + priority + suggested action
        │
        ▼
  TF-IDF Vectorisation   bigrams, sublinear TF, min_df=1
        │
        ▼
  Cosine Similarity      find top-5 similar existing complaints
        │
        ▼
  K-Means Clustering     auto k = min(⌈√n⌉, 8), re-runs on every insert
        │
        ▼
  Persist to SQLite
```

---

## Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Backend   | Python 3.11, FastAPI, Uvicorn     |
| NLP       | scikit-learn (TF-IDF, K-Means, cosine similarity) |
| Database  | SQLite via SQLAlchemy ORM         |
| Frontend  | React 18, Recharts, Axios         |
| Styling   | Inline CSS, DM Sans / DM Serif Display (Google Fonts) |

---

## Resetting the Database

```bash
cd backend
rm cais.db
python seed.py     # re-seeds with demo data
```
