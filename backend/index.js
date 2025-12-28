const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./db/db');
const { spawnSync } = require('child_process');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Basic health
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Create user record
app.post('/api/users', async (req, res) => {
  const { age, height_cm, weight_kg, smoking, ...rest } = req.body;
  try {
    const stmt = await db.run(`INSERT INTO users (age, height_cm, weight_kg, smoking, meta) VALUES (?, ?, ?, ?, ?)`,[age, height_cm, weight_kg, smoking, JSON.stringify(rest)]);
    res.json({ id: stmt.lastID });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

// Predict risk by calling Python script
app.post('/api/predict', (req, res) => {
  const input = req.body;
  // call python ml/predict.py --json '<json>'
  const pyPath = path.join(__dirname, '..', 'ml', 'predict.py');
  const result = spawnSync('python', [pyPath, JSON.stringify(input)], { encoding: 'utf8' });
  if (result.error) {
    console.error(result.error);
    return res.status(500).json({ error: 'python error' });
  }
  try {
    const out = JSON.parse(result.stdout);
    res.json(out);
  } catch (e) {
    console.error('parse error', result.stdout, result.stderr);
    res.status(500).json({ error: 'parse error' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
