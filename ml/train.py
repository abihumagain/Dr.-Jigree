"""
Dr. Jigree – ML Model Training
================================
Dataset : cardio_train.csv  (70,000 patients, Kaggle Cardiovascular Disease dataset)
Run     : python train.py
Output  : ml/model/model.pkl   (GradientBoosting pipeline: StandardScaler + classifier)
          ml/model/features.json

Feature mapping  cardio_train.csv  →  Dr. Jigree app
──────────────────────────────────────────────────────
age (days)  → age_years (float)
gender      → gender (1=female, 2=male)
height (cm) → height
weight (kg) → weight
bmi         → calculated: weight / (height/100)²
ap_hi       → systolic_bp
ap_lo       → diastolic_bp
cholesterol → 1=normal / 2=above normal / 3=well above normal
gluc        → 1=normal / 2=above normal / 3=well above normal
smoke       → smoking (0/1)
alco        → alcohol (0/1)
active      → exercise ≥3 days/week = 1, else 0
pulse_press → ap_hi - ap_lo  (cardiovascular stress proxy)
"""

import os
import json
import pandas as pd
import numpy as np
from sklearn.ensemble        import GradientBoostingClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing   import StandardScaler
from sklearn.pipeline        import Pipeline
from sklearn.metrics         import classification_report, roc_auc_score
import joblib

# ── Paths ──────────────────────────────────────────────────────────────────────
BASE       = os.path.dirname(os.path.abspath(__file__))
CSV_PATH   = os.path.join(BASE, 'cardio_train.csv')
MODEL_DIR  = os.path.join(BASE, 'model')
MODEL_PATH = os.path.join(MODEL_DIR, 'model.pkl')
FEAT_PATH  = os.path.join(MODEL_DIR, 'features.json')

# ── Load ───────────────────────────────────────────────────────────────────────
print("Loading cardio_train.csv …")
df = pd.read_csv(CSV_PATH, sep=';')
print(f"  Raw rows : {len(df):,}")

# ── Clean: remove physiologically impossible values ────────────────────────────
df = df[
    (df['ap_hi']  > 0)    & (df['ap_hi']  <= 300) &
    (df['ap_lo']  > 0)    & (df['ap_lo']  <= 200) &
    (df['ap_hi']  > df['ap_lo'])                   &
    (df['height'] >= 100) & (df['height'] <= 250)  &
    (df['weight'] >= 30)  & (df['weight'] <= 250)
].copy().reset_index(drop=True)
print(f"  Clean rows: {len(df):,}")

# ── Feature engineering ────────────────────────────────────────────────────────
df['age_years']      = df['age'] / 365.25
df['bmi']            = df['weight'] / (df['height'] / 100) ** 2
df['pulse_pressure'] = df['ap_hi'] - df['ap_lo']
df.drop(columns=['id', 'age'], inplace=True)

FEATURES = [
    'age_years', 'gender', 'height', 'weight', 'bmi',
    'ap_hi', 'ap_lo', 'cholesterol', 'gluc',
    'smoke', 'alco', 'active', 'pulse_pressure'
]

X = df[FEATURES]
y = df['cardio']

# ── Split ──────────────────────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, random_state=42, stratify=y
)
print(f"  Train: {len(X_train):,}  |  Test: {len(X_test):,}")

# ── Train ──────────────────────────────────────────────────────────────────────
print("\nTraining GradientBoostingClassifier …")
pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('clf',    GradientBoostingClassifier(
        n_estimators=300,
        learning_rate=0.08,
        max_depth=5,
        subsample=0.8,
        random_state=42,
        verbose=1
    ))
])

pipeline.fit(X_train, y_train)

# ── Evaluate ───────────────────────────────────────────────────────────────────
y_pred  = pipeline.predict(X_test)
y_proba = pipeline.predict_proba(X_test)[:, 1]

print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=['No Disease', 'Disease']))
print(f"ROC-AUC : {roc_auc_score(y_test, y_proba):.4f}")

cv = cross_val_score(pipeline, X, y, cv=5, scoring='roc_auc', n_jobs=-1)
print(f"5-Fold CV ROC-AUC: {cv.mean():.4f} ± {cv.std():.4f}")

# ── Save ───────────────────────────────────────────────────────────────────────
os.makedirs(MODEL_DIR, exist_ok=True)
joblib.dump(pipeline, MODEL_PATH)
with open(FEAT_PATH, 'w') as f:
    json.dump(FEATURES, f)

print(f"\n✅  Model saved    → {MODEL_PATH}")
print(f"✅  Features saved → {FEAT_PATH}")
print("\nRestart the backend — predict.py will automatically load the new model.")

