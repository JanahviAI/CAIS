# Complaint → Action Intelligence System (CAIS)

A full-stack web application that converts raw user complaints into actionable insights using NLP processing, rule-based classification, TF-IDF cosine similarity, and K-Means clustering. Features advanced analytics, anomaly detection, and root cause analysis.

---

## Project Structure

```
cais/
├── backend/                        # FastAPI server
│   ├── main.py                     # App entry point, CORS, router registration
│   ├── seed.py                     # Demo data seeder
│   ├── requirements.txt
│   ├── db/
│   │   ├── __init__.py
│   │   └── database.py             # SQLAlchemy engine + session + get_db()
│   ├── models/
│   │   ├── __init__.py
│   │   ├── complaint.py            # Complaint ORM + schemas
│   │   ├── user.py                 # User ORM + schemas
│   │   ├── audit_log.py            # Audit logging
│   │   ├── branch.py               # Branch management
│   │   ├── department.py           # Department management
│   │   └── location.py             # Location management
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py                 # Authentication routes
│   │   ├── complaints.py           # Complaint CRUD operations
│   │   ├── analytics.py            # Analytics & insights
│   │   ├── anomaly.py              # Anomaly detection
│   │   ├── departments.py          # Department management
│   │   └── rca.py                  # Root Cause Analysis
│   └── services/
│       ├── __init__.py
│       ├── auth_service.py         # Authentication logic
│       ├── complaint_service.py    # Complaint orchestration
│       ├── decision_engine.py      # Rule-based classification
│       ├── nlp.py                  # NLP pipeline (TF-IDF, K-Means, similarity)
│       ├── analytics_service.py    # Analytics calculations
│       ├── anomaly_detection.py    # Anomaly detection algorithms
│       ├── anomaly_service.py      # Anomaly service orchestration
│       ├── email_service.py        # Email notifications
│       ├── escalation_service.py   # Escalation logic
│       ├── location_utils.py       # Location utilities
│       └── rca_service.py          # Root cause analysis service
│
└── frontend/                       # React application
    ├── package.json
    ├── package-lock.json
    ├── public/
    │   └── index.html
    └── src/
        ├── index.js
        ├── App.jsx                 # Root component + auth routing
        ├── services/
        │   └── api.js              # Axios HTTP client + API calls
        ├── hooks/
        │   ├── useComplaints.js    # Complaint list state + API
        │   └── useStats.js         # Analytics state + API
        ├── data/
        │   └── constants.js        # Color maps, chart palette
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

### 1 — Clone the repository

```bash
git clone https://github.com/JanahviAI/CAIS.git
cd CAIS
```

---

### 2 — Backend Setup

Open **Terminal 1**:

```bash
cd backend

# Create a virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server (auto-seeds DB on first run)
uvicorn main:app --reload --port 8000
```

The API is now live at **http://localhost:8000**  
Interactive API docs: **http://localhost:8000/docs**

> The database file `cais.db` is created automatically in the `backend/` folder.  
> Demo data (15+ complaints) is seeded on first startup.

---

### 3 — Frontend Setup

Open **Terminal 2**:

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

### Authentication
| Method | Path              | Description              |
|--------|-------------------|--------------------------|
| POST   | /api/auth/login   | Login user, returns token |

### Complaints
| Method | Path                      | Description                              |
|--------|---------------------------|------------------------------------------|
| POST   | /api/complaints/          | Submit complaint (runs full NLP pipeline)|
| GET    | /api/complaints/          | List complaints; filter by user/status/priority |
| GET    | /api/complaints/{id}      | Get single complaint                     |
| PATCH  | /api/complaints/{id}      | Update status / action_taken             |

### Analytics
| Method | Path                      | Description                              |
|--------|---------------------------|------------------------------------------|
| GET    | /api/analytics/stats      | KPI counts + chart data arrays           |
| GET    | /api/analytics/clusters   | Complaints grouped by NLP cluster        |

### Anomaly Detection
| Method | Path                      | Description                              |
|--------|---------------------------|------------------------------------------|
| GET    | /api/anomaly/detect       | Detect anomalous complaints              |
| GET    | /api/anomaly/report       | Anomaly detection report                 |

### Root Cause Analysis
| Method | Path                      | Description                              |
|--------|---------------------------|------------------------------------------|
| GET    | /api/rca/{complaint_id}   | Generate RCA for complaint               |
| GET    | /api/rca/report           | RCA summary report                       |

### Departments
| Method | Path                      | Description                              |
|--------|---------------------------|------------------------------------------|
| GET    | /api/departments/         | List all departments                     |
| POST   | /api/departments/         | Create department                        |

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
  Anomaly Detection      identify outlier patterns
        │
        ▼
  Persist to SQLite
```

---

## Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Backend   | Python 3.10+, FastAPI, Uvicorn    |
| NLP       | scikit-learn (TF-IDF, K-Means, cosine similarity) |
| Anomaly   | Isolation Forest, Statistical Analysis |
| Database  | SQLite via SQLAlchemy ORM         |
| Frontend  | React 18, Recharts, Axios         |
| Styling   | Inline CSS, Lucide Icons, Google Fonts |

---

## Resetting the Database

```bash
cd backend
rm cais.db
python seed.py     # re-seeds with demo data
```

Then restart the backend server:

```bash
uvicorn main:app --reload --port 8000
```

---

## Features

### For Admins
- Dashboard with real-time analytics
- Complaint overview and filtering
- Anomaly detection and alerts
- Root cause analysis (RCA) for patterns
- Department and location management
- Audit logging of all changes

### For Citizens
- Simple complaint submission form
- Real-time complaint status tracking
- View similar complaints
- Receive notifications on updates

---

## Development Notes

- **Database**: SQLite (auto-created, no setup required)
- **CORS**: Enabled for frontend on `http://localhost:3000`
- **Hot Reload**: Both backend and frontend support auto-reload during development
- **API Documentation**: Available at `/docs` endpoint (Swagger UI)

---

## Troubleshooting

### Backend won't start
- Ensure Python 3.10+ is installed: `python --version`
- Check virtual environment is activated
- Try: `pip install -r requirements.txt` again

### Frontend won't start
- Ensure Node.js 18+ is installed: `node --version`
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules/` and `package-lock.json`, then: `npm install` again

### Database issues
- Delete `cais.db` and restart the backend to re-seed
- Check that `backend/` folder has write permissions

---

## License

This project is open source and available under the MIT License.

---

## Support

For issues, feature requests, or questions, please open an issue on GitHub.
