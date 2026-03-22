const express     = require('express');
const path        = require('path');
const { spawnSync } = require('child_process');
const db          = require('../db/db');
const auth        = require('../middleware/auth');

const router = express.Router();

// POST /api/assess  — run ML prediction and persist result
router.post('/', auth, async (req, res) => {
  const input  = { ...req.body, user_id: req.user.id };
  const pyPath = path.join(__dirname, '..', '..', 'ml', 'predict.py');
  const result = spawnSync('python', [pyPath, JSON.stringify(input)], { encoding: 'utf8' });

  if (result.error) return res.status(500).json({ error: 'Python not available' });

  let prediction;
  try {
    prediction = JSON.parse(result.stdout);
  } catch {
    return res.status(500).json({ error: 'ML parse error', detail: result.stderr });
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
