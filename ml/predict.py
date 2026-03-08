"""
Dr. Jigree – Health Risk Prediction
Calls trained ML model if available, otherwise uses a comprehensive rule-based engine.
Outputs JSON to stdout.
"""
import sys
import json
import os
import math

# ─── Input ────────────────────────────────────────────────────────────────────
try:
    raw = json.loads(sys.argv[1]) if len(sys.argv) > 1 else {}
except Exception as e:
    print(json.dumps({"error": f"Invalid input: {e}"}))
    sys.exit(1)

def g(key, default=0):
    v = raw.get(key, default)
    try:
        return float(v) if v not in (None, '', False, True) else (1.0 if v is True else 0.0)
    except:
        return default

age           = g('age', 30)
height_cm     = g('height_cm', 170)
weight_kg     = g('weight_kg', 70)
smoking       = 1 if raw.get('smoking') else 0
alcohol       = 1 if raw.get('alcohol') else 0
exercise_days = g('exercise_days', 0)
systolic_bp   = g('systolic_bp', 120)
diastolic_bp  = g('diastolic_bp', 80)
glucose       = g('glucose', 90)
cholesterol   = g('cholesterol', 180)
family_history = 1 if raw.get('family_history') else 0
stress_level  = g('stress_level', 3)   # 1-5

bmi = weight_kg / ((height_cm / 100) ** 2) if height_cm > 0 else 25.0

# ─── Try ML model first ───────────────────────────────────────────────────────
model_path = os.path.join(os.path.dirname(__file__), 'model', 'model.pkl')
ml_used    = False
ml_risk    = None
ml_score   = None

if os.path.exists(model_path):
    try:
        import joblib
        import numpy as np
        model = joblib.load(model_path)
        X = np.array([[age, height_cm, weight_kg, bmi, smoking, alcohol,
                       exercise_days, systolic_bp, diastolic_bp, glucose,
                       cholesterol, family_history, stress_level]])
        pred      = model.predict(X)[0]
        proba     = model.predict_proba(X)[0]
        ml_score  = float(proba[int(pred)])
        ml_risk   = 'High' if int(pred) == 1 else ('Moderate' if ml_score < 0.75 else 'Low')
        ml_used   = True
    except Exception:
        ml_used = False

# ─── Rule-based risk engine ───────────────────────────────────────────────────
def rule_score():
    score = 0.0

    # Age
    if age >= 65:   score += 3.0
    elif age >= 50: score += 2.0
    elif age >= 40: score += 1.0

    # BMI
    if bmi >= 35:       score += 3.0
    elif bmi >= 30:     score += 2.0
    elif bmi >= 25:     score += 1.0
    elif bmi < 18.5:    score += 1.0

    # Blood pressure
    if systolic_bp >= 180 or diastolic_bp >= 120: score += 4.0
    elif systolic_bp >= 140 or diastolic_bp >= 90: score += 2.5
    elif systolic_bp >= 130 or diastolic_bp >= 85: score += 1.0

    # Glucose (mg/dL)
    if glucose >= 200:  score += 4.0
    elif glucose >= 126: score += 2.5
    elif glucose >= 100: score += 1.0

    # Cholesterol (mg/dL)
    if cholesterol >= 240:  score += 2.0
    elif cholesterol >= 200: score += 1.0

    # Lifestyle
    if smoking:        score += 3.0
    if alcohol:        score += 1.5
    if exercise_days <= 1: score += 1.5
    elif exercise_days >= 5: score -= 1.0

    # Family history
    if family_history: score += 2.0

    # Stress
    if stress_level >= 5: score += 2.0
    elif stress_level >= 4: score += 1.0

    return max(0.0, score)

raw_score = rule_score()
max_score = 25.0
normalised = min(raw_score / max_score, 1.0)

if ml_used:
    final_score = 0.6 * ml_score + 0.4 * normalised
else:
    final_score = normalised

if final_score >= 0.60:   risk_label = 'High'
elif final_score >= 0.35: risk_label = 'Moderate'
else:                     risk_label = 'Low'

# ─── Personalised recommendations ─────────────────────────────────────────────
recommendations = []

if bmi >= 30:
    recommendations.append("Work towards a healthier weight through balanced diet and regular exercise. Even a 5–10% reduction in weight significantly reduces cardiovascular risk.")
elif bmi >= 25:
    recommendations.append("You are slightly overweight. Aim for 30 minutes of moderate exercise at least 5 days per week and reduce processed food intake.")
elif bmi < 18.5:
    recommendations.append("You are underweight. Consult a nutritionist to build a healthy, calorie-sufficient diet.")

if systolic_bp >= 140 or diastolic_bp >= 90:
    recommendations.append("Your blood pressure is elevated. Reduce sodium intake, avoid caffeine, exercise regularly, and consult your doctor about medication if lifestyle changes are insufficient.")
elif systolic_bp >= 130:
    recommendations.append("Your blood pressure is slightly elevated. Monitor it weekly and reduce stress and salt intake.")

if glucose >= 126:
    recommendations.append("Your fasting glucose indicates possible diabetes. Consult your doctor immediately for an HbA1c test and dietary guidance.")
elif glucose >= 100:
    recommendations.append("Your glucose is in the pre-diabetic range. Adopt a low-glycaemic diet, exercise regularly, and recheck in 3 months.")

if cholesterol >= 240:
    recommendations.append("Your cholesterol is high. Adopt a heart-healthy diet (less saturated fat, more fibre) and discuss statin therapy with your doctor.")
elif cholesterol >= 200:
    recommendations.append("Your cholesterol is borderline high. Increase omega-3 intake (oily fish, walnuts) and reduce fried/processed food.")

if smoking:
    recommendations.append("Smoking significantly increases your risk of heart disease, stroke and cancer. Consider a smoking cessation programme — your doctor can provide support and medication.")

if alcohol:
    recommendations.append("Limit alcohol to recommended guidelines (≤14 units/week). Excessive alcohol raises blood pressure and liver disease risk.")

if exercise_days <= 1:
    recommendations.append("You are largely sedentary. Start with 20-minute walks daily, building up to 150 minutes of moderate activity per week.")
elif exercise_days < 5:
    recommendations.append("Try to increase exercise to at least 4–5 days per week for optimal cardiovascular benefit.")

if family_history:
    recommendations.append("With a family history of cardiovascular disease, you should have regular screening (blood pressure, cholesterol, glucose) at least annually.")

if stress_level >= 4:
    recommendations.append("High stress negatively impacts your heart, immunity and mental health. Consider mindfulness, yoga, adequate sleep, and speaking to a mental health professional.")

if age >= 50:
    recommendations.append("At your age, annual health check-ups including cancer screening (bowel, breast/prostate), eye tests and dental checks are recommended.")

if not recommendations:
    recommendations.append("Your health indicators look good! Maintain your healthy lifestyle — regular exercise, balanced diet, adequate sleep and routine check-ups.")

# ─── Output ───────────────────────────────────────────────────────────────────
output = {
    "risk":            risk_label,
    "score":           round(final_score, 3),
    "score_percent":   round(final_score * 100, 1),
    "bmi":             round(bmi, 1),
    "bmi_category":    ("Underweight" if bmi < 18.5 else "Normal" if bmi < 25 else "Overweight" if bmi < 30 else "Obese"),
    "ml_model_used":   ml_used,
    "recommendations": recommendations,
    "indicators": {
        "blood_pressure": "High"     if systolic_bp >= 140 else "Elevated" if systolic_bp >= 130 else "Normal",
        "glucose":        "High"     if glucose >= 126     else "Elevated"  if glucose >= 100   else "Normal",
        "cholesterol":    "High"     if cholesterol >= 240 else "Borderline" if cholesterol >= 200 else "Normal",
        "bmi_status":     "Obese"    if bmi >= 30          else "Overweight" if bmi >= 25       else "Normal",
        "lifestyle":      "Poor"     if (smoking or alcohol or exercise_days <= 1) else "Fair" if exercise_days < 4 else "Good"
    }
}

print(json.dumps(output))

