"""
Dr. Jigree – ML Model Training
Run: python train.py
Replace the synthetic data below with real patient data when available.
Features: age, height_cm, weight_kg, bmi, smoking, alcohol, exercise_days,
          systolic_bp, diastolic_bp, glucose, cholesterol, family_history, stress_level
Label   : 0 = Low/Moderate risk, 1 = High risk
"""
import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, confusion_matrix
import joblib
import os

# ─── Synthetic training data ──────────────────────────────────────────────────
# Each row: age, height_cm, weight_kg, bmi, smoking, alcohol, exercise_days,
#           systolic_bp, diastolic_bp, glucose, cholesterol, family_history, stress_level, label
raw = [
    # Low risk profiles
    [25, 172, 68,  23.0, 0, 0, 5, 115, 75, 88,  175, 0, 2, 0],
    [30, 168, 65,  23.0, 0, 0, 4, 118, 78, 90,  180, 0, 2, 0],
    [22, 175, 72,  23.5, 0, 0, 6, 110, 70, 85,  160, 0, 1, 0],
    [35, 165, 60,  22.0, 0, 0, 4, 120, 80, 92,  185, 0, 3, 0],
    [28, 180, 80,  24.7, 0, 0, 5, 122, 79, 95,  190, 0, 2, 0],
    [40, 170, 70,  24.2, 0, 0, 3, 125, 82, 98,  195, 0, 3, 0],
    [33, 178, 76,  24.0, 0, 1, 4, 120, 78, 93,  188, 0, 3, 0],
    [27, 162, 55,  21.0, 0, 0, 6, 108, 68, 82,  155, 0, 1, 0],
    # Moderate-border profiles
    [45, 170, 82,  28.4, 0, 1, 2, 132, 84, 102, 205, 0, 3, 0],
    [50, 165, 78,  28.7, 0, 0, 2, 128, 83, 105, 200, 1, 4, 0],
    [38, 175, 90,  29.4, 1, 0, 2, 134, 86, 108, 210, 0, 3, 1],
    [42, 168, 88,  31.2, 0, 1, 1, 138, 88, 112, 215, 0, 4, 1],
    # High risk profiles
    [55, 160, 90,  35.2, 1, 1, 0, 155, 96, 145, 250, 1, 5, 1],
    [60, 158, 88,  35.3, 1, 0, 0, 160, 100, 160, 260, 1, 4, 1],
    [65, 165, 95,  34.9, 1, 1, 0, 170, 105, 180, 270, 1, 5, 1],
    [70, 155, 80,  33.3, 1, 0, 1, 175, 108, 200, 280, 1, 4, 1],
    [58, 170, 100, 34.6, 1, 1, 0, 165, 102, 155, 255, 1, 5, 1],
    [52, 162, 92,  35.0, 1, 0, 0, 150, 95, 140, 248, 1, 5, 1],
    [48, 168, 95,  33.7, 0, 1, 1, 145, 92, 135, 245, 1, 4, 1],
    [63, 155, 85,  35.4, 1, 1, 0, 178, 110, 190, 290, 1, 5, 1],
    [56, 172, 98,  33.1, 1, 0, 1, 158, 98, 148, 252, 1, 4, 1],
    [44, 160, 86,  33.6, 0, 0, 0, 142, 90, 130, 242, 1, 5, 1],
]

cols = ['age','height_cm','weight_kg','bmi','smoking','alcohol','exercise_days',
        'systolic_bp','diastolic_bp','glucose','cholesterol','family_history','stress_level']

df = pd.DataFrame(raw, columns=cols + ['label'])
X  = df[cols]
y  = df['label']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('clf',    GradientBoostingClassifier(n_estimators=200, learning_rate=0.1, max_depth=4, random_state=42))
])

pipeline.fit(X_train, y_train)

y_pred = pipeline.predict(X_test)
print("Classification Report:")
print(classification_report(y_test, y_pred, target_names=['Low/Moderate', 'High']))
print("Confusion Matrix:")
print(confusion_matrix(y_test, y_pred))

cv_scores = cross_val_score(pipeline, X, y, cv=3, scoring='accuracy')
print(f"\nCross-validation accuracy: {cv_scores.mean():.2f} (+/- {cv_scores.std():.2f})")

os.makedirs(os.path.join(os.path.dirname(__file__), 'model'), exist_ok=True)
model_path = os.path.join(os.path.dirname(__file__), 'model', 'model.pkl')
joblib.dump(pipeline, model_path)
print(f"\n✅  Model saved to {model_path}")
print("Replace the synthetic data above with real health data for production use.")

