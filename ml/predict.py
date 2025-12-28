import sys
import json
import joblib
import os
import numpy as np

model_path = os.path.join(os.path.dirname(__file__), 'model', 'model.pkl')
if not os.path.exists(model_path):
    print(json.dumps({'error': 'Model not trained'}))
    sys.exit(1)

model = joblib.load(model_path)

try:
    input_data = json.loads(sys.argv[1])
    X = np.array([[input_data.get('age', 0), input_data.get('height_cm', 0), input_data.get('weight_kg', 0), int(input_data.get('smoking', 0))]])
    pred = model.predict(X)[0]
    prob = model.predict_proba(X)[0][int(pred)]
    result = {
        'risk': 'High' if pred == 1 else 'Low',
        'score': float(prob)
    }
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({'error': str(e)}))
    sys.exit(1)
