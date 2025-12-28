import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib
import os

# Dummy data for initial training
# In real use, replace with actual health data
X = pd.DataFrame([
    {'age': 25, 'height_cm': 170, 'weight_kg': 70, 'smoking': 0},
    {'age': 55, 'height_cm': 160, 'weight_kg': 80, 'smoking': 1},
    {'age': 40, 'height_cm': 180, 'weight_kg': 90, 'smoking': 0},
    {'age': 65, 'height_cm': 155, 'weight_kg': 60, 'smoking': 1},
    {'age': 30, 'height_cm': 175, 'weight_kg': 75, 'smoking': 0},
])
y = [0, 1, 1, 1, 0]  # 1 = high risk, 0 = low risk

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

clf = RandomForestClassifier(n_estimators=10, random_state=42)
clf.fit(X_train, y_train)

print(classification_report(y_test, clf.predict(X_test)))

os.makedirs('model', exist_ok=True)
joblib.dump(clf, 'model/model.pkl')
