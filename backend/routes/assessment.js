const express     = require('express');
const path        = require('path');
const { spawnSync } = require('child_process');
const db          = require('../db/db');
const auth        = require('../middleware/auth');

const router = express.Router();

// GET /api/assess/model-status  — diagnostic: verify model can be loaded
router.get('/model-status', auth, (req, res) => {
  const pyPath    = path.join(__dirname, '..', '..', 'ml', 'predict.py');
  const modelPath = path.join(__dirname, '..', '..', 'ml', 'model', 'model.pkl');
  const featPath  = path.join(__dirname, '..', '..', 'ml', 'model', 'features.json');
  const fs = require('fs');

  const modelExists = fs.existsSync(modelPath);
  const featExists  = fs.existsSync(featPath);

  if (!modelExists) {
    return res.json({ status: 'missing', message: 'model.pkl not found — run ml/train.py first', modelExists, featExists });
  }

  // Try a minimal prediction to confirm joblib can load the model
  const testInput = JSON.stringify({
    age: 35, height_cm: 170, weight_kg: 70,
    systolic_bp: 120, diastolic_bp: 80,
    glucose: 90, cholesterol: 190,
    smoking: false, alcohol: false, exercise_days: 3,
    family_history: false, stress_level: 2
  });
  const result = spawnSync('python', [pyPath, testInput], { encoding: 'utf8' });
  if (result.error) {
    return res.json({ status: 'error', message: 'Python not available', error: result.error.message });
  }
  let prediction;
  try { prediction = JSON.parse(result.stdout); } catch {
    return res.json({ status: 'error', message: 'Could not parse Python output', stderr: result.stderr, stdout: result.stdout });
  }
  res.json({
    status: prediction.ml_model_used ? 'active' : 'fallback',
    message: prediction.ml_model_used
      ? 'ML model loaded and scoring successfully'
      : 'Model file exists but failed to load — using rule-based fallback',
    modelExists, featExists,
    test_result: {
      risk:             prediction.risk,
      score_percent:    prediction.score_percent,
      ml_model_used:    prediction.ml_model_used,
      ml_disease_prob:  prediction.ml_disease_prob,
    },
    stderr: result.stderr || null,
  });
});

router.post('/', auth, async (req, res) => {
  const input  = { ...req.body, user_id: req.user.id };
  const pyPath = path.join(__dirname, '..', '..', 'ml', 'predict.py');
  const result = spawnSync('python', [pyPath, JSON.stringify(input)], { encoding: 'utf8' });

  if (result.error) return res.status(500).json({ error: 'Python not available' });

  let prediction;
  try {
    prediction = JSON.parse(result.stdout);
  } catch {
    return res.status(500).json({ error: 'ML parse error', detail: result.stderr, stdout: result.stdout });
  }
  if (prediction.error) return res.status(500).json(prediction);

  const bmi = input.weight_kg && input.height_cm
    ? parseFloat((input.weight_kg / ((input.height_cm / 100) ** 2)).toFixed(1))
    : null;

  const database = await db;
  const { lastID } = await database.run(
    `INSERT INTO risk_assessments
     (user_id, age, height_cm, weight_kg, bmi, smoking, alcohol, exercise_days,
      systolic_bp, diastolic_bp, glucose, cholesterol, family_history, stress_level,
      risk_score, risk_label, recommendations)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      req.user.id, input.age, input.height_cm, input.weight_kg, bmi,
      input.smoking ? 1 : 0, input.alcohol ? 1 : 0, input.exercise_days,
      input.systolic_bp, input.diastolic_bp, input.glucose, input.cholesterol,
      input.family_history ? 1 : 0, input.stress_level,
      prediction.score, prediction.risk, JSON.stringify(prediction.recommendations),
    ]
  );
  await database.run(
    `INSERT INTO notifications (user_id, message, type) VALUES (?,?,?)`,
    [req.user.id,
     `Health assessment completed — Risk: ${prediction.risk} (${(prediction.score * 100).toFixed(1)}%)${bmi ? ', BMI: ' + bmi : ''}.`,
     'info']
  );
  res.json({ id: lastID, bmi, ...prediction });
});

// GET /api/assessments  — history
router.get('/', auth, async (req, res) => {
  const database = await db;
  const rows = await database.all(
    'SELECT * FROM risk_assessments WHERE user_id=? ORDER BY assessed_at DESC',
    [req.user.id]
  );
  res.json(rows);
});

module.exports = router;
