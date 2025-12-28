Project: Health Risk Portfolio - Boilerplate

Overview
- Monorepo with three parts:
  - backend: Node.js + Express + SQLite (local DB)
  - frontend: Next.js app (React)
  - ml: Python scripts to train and predict (scikit-learn)

Goals
- Collect user health inputs, store locally, compute risk using a trained ML model.
- Run entirely locally (SQLite DB in repo) — no external DB service required.

Quick start (PowerShell)
1) Backend
   cd backend
   npm install
   npm run init-db    # creates SQLite DB and tables
   npm start          # starts server on http://localhost:4000

2) Frontend
   cd frontend
   npm install
   npm run dev        # starts Next.js on http://localhost:3000

3) Python ML
   cd ml
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   python train.py    # trains a simple model and writes ml/model/model.pkl

Notes
- The backend calls the Python predictor script for inference; ensure Python is on PATH.
- SQLite DB file is created at backend/data/db.sqlite and committed by default (remove from git if not desired).

Structure
- backend/: Node.js API and SQLite DB init
- frontend/: Next.js app with a simple form
- ml/: training and prediction scripts (scikit-learn)

License
- MIT
