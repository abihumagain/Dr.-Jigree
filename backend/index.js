const express  = require('express');
const cors     = require('cors');
const bodyParser = require('body-parser');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const path     = require('path');
const fs       = require('fs');
const multer   = require('multer');
const { spawnSync } = require('child_process');
const db       = require('./db/db');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'drjigree_super_secret_2026';

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(bodyParser.json());

// ── File upload setup ─────────────────────────────────────
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename:    (_, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });
app.use('/uploads', express.static(uploadDir));

// ── Auth middleware ───────────────────────────────────────
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'No token' });
  try {
    const token = header.split(' ')[1];
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ── Health check ──────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', version: '1.0.0' }));

// ════════════════════════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════════════════════════
app.post('/api/auth/signup', async (req, res) => {
  const { full_name, email, password, date_of_birth, gender } = req.body;
  if (!full_name || !email || !password)
    return res.status(400).json({ error: 'full_name, email and password are required' });
  try {
    const database = await db;
    const exists = await database.get('SELECT id FROM users WHERE email = ?', [email]);
    if (exists) return res.status(409).json({ error: 'Email already registered' });
    const hash = await bcrypt.hash(password, 10);
    const { lastID } = await database.run(
      `INSERT INTO users (full_name, email, password_hash, date_of_birth, gender)
       VALUES (?, ?, ?, ?, ?)`,
      [full_name, email, hash, date_of_birth || null, gender || null]
    );
    await database.run(
      `INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)`,
      [lastID, `Welcome to Dr. Jigree, ${full_name}! Start by completing your health assessment.`, 'welcome']
    );
    const token = jwt.sign({ id: lastID, email }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: lastID, full_name, email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'email and password required' });
  try {
    const database = await db;
    const user = await database.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    const { password_hash, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ════════════════════════════════════════════════════════════
//  USER PROFILE
// ════════════════════════════════════════════════════════════
app.get('/api/profile', auth, async (req, res) => {
  const database = await db;
  const user = await database.get(
    'SELECT id,full_name,email,date_of_birth,gender,blood_type,phone,address,emergency_contact,profile_picture,created_at FROM users WHERE id=?',
    [req.user.id]
  );
  res.json(user);
});

app.put('/api/profile', auth, async (req, res) => {
  const { full_name, date_of_birth, gender, blood_type, phone, address, emergency_contact } = req.body;
  const database = await db;
  await database.run(
    `UPDATE users SET full_name=?, date_of_birth=?, gender=?, blood_type=?, phone=?, address=?, emergency_contact=?
     WHERE id=?`,
    [full_name, date_of_birth, gender, blood_type, phone, address, emergency_contact, req.user.id]
  );
  const user = await database.get(
    'SELECT id,full_name,email,date_of_birth,gender,blood_type,phone,address,emergency_contact,profile_picture,created_at FROM users WHERE id=?',
    [req.user.id]
  );
  res.json(user);
});

app.post('/api/profile/picture', auth, upload.single('picture'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const url = `/uploads/${req.file.filename}`;
  const database = await db;
  await database.run('UPDATE users SET profile_picture=? WHERE id=?', [url, req.user.id]);
  res.json({ profile_picture: url });
});

// ════════════════════════════════════════════════════════════
//  HEALTH RECORDS
// ════════════════════════════════════════════════════════════
app.get('/api/health-records', auth, async (req, res) => {
  const database = await db;
  const records = await database.all(
    'SELECT * FROM health_records WHERE user_id=? ORDER BY recorded_at DESC',
    [req.user.id]
  );
  res.json(records);
});

app.post('/api/health-records', auth, async (req, res) => {
  const {
    record_type, title, systolic_bp, diastolic_bp, heart_rate, temperature, oxygen_sat,
    glucose, cholesterol, hdl, ldl, triglycerides, hba1c, notes
  } = req.body;
  if (!record_type || !title)
    return res.status(400).json({ error: 'record_type and title required' });
  const database = await db;
  const { lastID } = await database.run(
    `INSERT INTO health_records
     (user_id,record_type,title,systolic_bp,diastolic_bp,heart_rate,temperature,oxygen_sat,
      glucose,cholesterol,hdl,ldl,triglycerides,hba1c,notes)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [req.user.id, record_type, title, systolic_bp, diastolic_bp, heart_rate, temperature,
     oxygen_sat, glucose, cholesterol, hdl, ldl, triglycerides, hba1c, notes]
  );
  const record = await database.get('SELECT * FROM health_records WHERE id=?', [lastID]);
  res.status(201).json(record);
});

app.delete('/api/health-records/:id', auth, async (req, res) => {
  const database = await db;
  await database.run('DELETE FROM health_records WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
  res.json({ success: true });
});

// ════════════════════════════════════════════════════════════
//  RISK ASSESSMENT  (calls Python ML model)
// ════════════════════════════════════════════════════════════
app.post('/api/assess', auth, async (req, res) => {
  const input = { ...req.body, user_id: req.user.id };
  const pyPath = path.join(__dirname, '..', 'ml', 'predict.py');
  const result = spawnSync('python', [pyPath, JSON.stringify(input)], { encoding: 'utf8' });
  if (result.error) return res.status(500).json({ error: 'Python not available' });
  let prediction;
  try {
    prediction = JSON.parse(result.stdout);
  } catch {
    return res.status(500).json({ error: 'ML parse error', detail: result.stderr });
  }
  if (prediction.error) return res.status(500).json(prediction);

  // Persist assessment
  const bmi = input.weight_kg && input.height_cm
    ? parseFloat((input.weight_kg / ((input.height_cm / 100) ** 2)).toFixed(1))
    : null;
  const database = await db;
  const { lastID } = await database.run(
    `INSERT INTO risk_assessments
     (user_id,age,height_cm,weight_kg,bmi,smoking,alcohol,exercise_days,
      systolic_bp,diastolic_bp,glucose,cholesterol,family_history,stress_level,
      risk_score,risk_label,recommendations)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [req.user.id, input.age, input.height_cm, input.weight_kg, bmi,
     input.smoking?1:0, input.alcohol?1:0, input.exercise_days,
     input.systolic_bp, input.diastolic_bp, input.glucose, input.cholesterol,
     input.family_history?1:0, input.stress_level,
     prediction.score, prediction.risk, JSON.stringify(prediction.recommendations)]
  );
  res.json({ id: lastID, bmi, ...prediction });
});

app.get('/api/assessments', auth, async (req, res) => {
  const database = await db;
  const rows = await database.all(
    'SELECT * FROM risk_assessments WHERE user_id=? ORDER BY assessed_at DESC',
    [req.user.id]
  );
  res.json(rows);
});

// ════════════════════════════════════════════════════════════
//  MEDICATIONS
// ════════════════════════════════════════════════════════════
app.get('/api/medications', auth, async (req, res) => {
  const database = await db;
  const meds = await database.all('SELECT * FROM medications WHERE user_id=? ORDER BY created_at DESC', [req.user.id]);
  res.json(meds);
});

app.post('/api/medications', auth, async (req, res) => {
  const { name, dosage, frequency, start_date, end_date, prescriber, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const database = await db;
  const { lastID } = await database.run(
    `INSERT INTO medications (user_id,name,dosage,frequency,start_date,end_date,prescriber,notes)
     VALUES (?,?,?,?,?,?,?,?)`,
    [req.user.id, name, dosage, frequency, start_date, end_date, prescriber, notes]
  );
  const med = await database.get('SELECT * FROM medications WHERE id=?', [lastID]);
  res.status(201).json(med);
});

app.put('/api/medications/:id', auth, async (req, res) => {
  const { name, dosage, frequency, start_date, end_date, prescriber, notes, active } = req.body;
  const database = await db;
  await database.run(
    `UPDATE medications SET name=?,dosage=?,frequency=?,start_date=?,end_date=?,prescriber=?,notes=?,active=?
     WHERE id=? AND user_id=?`,
    [name, dosage, frequency, start_date, end_date, prescriber, notes, active, req.params.id, req.user.id]
  );
  const med = await database.get('SELECT * FROM medications WHERE id=?', [req.params.id]);
  res.json(med);
});

app.delete('/api/medications/:id', auth, async (req, res) => {
  const database = await db;
  await database.run('DELETE FROM medications WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
  res.json({ success: true });
});

// ════════════════════════════════════════════════════════════
//  APPOINTMENTS
// ════════════════════════════════════════════════════════════
app.get('/api/appointments', auth, async (req, res) => {
  const database = await db;
  const appts = await database.all(
    'SELECT * FROM appointments WHERE user_id=? ORDER BY appointment_date, appointment_time',
    [req.user.id]
  );
  res.json(appts);
});

app.post('/api/appointments', auth, async (req, res) => {
  const { title, doctor_name, specialty, location, appointment_date, appointment_time, notes } = req.body;
  if (!title || !appointment_date) return res.status(400).json({ error: 'title and appointment_date required' });
  const database = await db;
  const { lastID } = await database.run(
    `INSERT INTO appointments (user_id,title,doctor_name,specialty,location,appointment_date,appointment_time,notes)
     VALUES (?,?,?,?,?,?,?,?)`,
    [req.user.id, title, doctor_name, specialty, location, appointment_date, appointment_time, notes]
  );
  const appt = await database.get('SELECT * FROM appointments WHERE id=?', [lastID]);
  res.status(201).json(appt);
});

app.put('/api/appointments/:id', auth, async (req, res) => {
  const { title, doctor_name, specialty, location, appointment_date, appointment_time, status, notes } = req.body;
  const database = await db;
  await database.run(
    `UPDATE appointments SET title=?,doctor_name=?,specialty=?,location=?,appointment_date=?,appointment_time=?,status=?,notes=?
     WHERE id=? AND user_id=?`,
    [title, doctor_name, specialty, location, appointment_date, appointment_time, status, notes, req.params.id, req.user.id]
  );
  const appt = await database.get('SELECT * FROM appointments WHERE id=?', [req.params.id]);
  res.json(appt);
});

app.delete('/api/appointments/:id', auth, async (req, res) => {
  const database = await db;
  await database.run('DELETE FROM appointments WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
  res.json({ success: true });
});

// ════════════════════════════════════════════════════════════
//  DOCUMENTS
// ════════════════════════════════════════════════════════════
app.get('/api/documents', auth, async (req, res) => {
  const database = await db;
  const docs = await database.all('SELECT * FROM documents WHERE user_id=? ORDER BY uploaded_at DESC', [req.user.id]);
  res.json(docs);
});

app.post('/api/documents', auth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const { doc_type = 'other', title } = req.body;
  const database = await db;
  const { lastID } = await database.run(
    `INSERT INTO documents (user_id,doc_type,title,file_path,file_name,file_size)
     VALUES (?,?,?,?,?,?)`,
    [req.user.id, doc_type, title || req.file.originalname, `/uploads/${req.file.filename}`, req.file.originalname, req.file.size]
  );
  const doc = await database.get('SELECT * FROM documents WHERE id=?', [lastID]);
  res.status(201).json(doc);
});

app.delete('/api/documents/:id', auth, async (req, res) => {
  const database = await db;
  const doc = await database.get('SELECT * FROM documents WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
  if (doc) {
    const fp = path.join(__dirname, doc.file_path);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
    await database.run('DELETE FROM documents WHERE id=?', [req.params.id]);
  }
  res.json({ success: true });
});

// ════════════════════════════════════════════════════════════
//  NOTIFICATIONS
// ════════════════════════════════════════════════════════════
app.get('/api/notifications', auth, async (req, res) => {
  const database = await db;
  const notifs = await database.all(
    'SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 50',
    [req.user.id]
  );
  res.json(notifs);
});

app.put('/api/notifications/:id/read', auth, async (req, res) => {
  const database = await db;
  await database.run('UPDATE notifications SET read=1 WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
  res.json({ success: true });
});

app.put('/api/notifications/read-all', auth, async (req, res) => {
  const database = await db;
  await database.run('UPDATE notifications SET read=1 WHERE user_id=?', [req.user.id]);
  res.json({ success: true });
});

// ════════════════════════════════════════════════════════════
//  DASHBOARD SUMMARY
// ════════════════════════════════════════════════════════════
app.get('/api/dashboard', auth, async (req, res) => {
  const database = await db;
  const uid = req.user.id;
  const [user, latestAssessment, recentRecords, activeMeds, upcomingAppts, unreadNotifs] = await Promise.all([
    database.get('SELECT full_name,profile_picture FROM users WHERE id=?', [uid]),
    database.get('SELECT * FROM risk_assessments WHERE user_id=? ORDER BY assessed_at DESC LIMIT 1', [uid]),
    database.all('SELECT * FROM health_records WHERE user_id=? ORDER BY recorded_at DESC LIMIT 5', [uid]),
    database.all('SELECT * FROM medications WHERE user_id=? AND active=1 ORDER BY name', [uid]),
    database.all(`SELECT * FROM appointments WHERE user_id=? AND status='scheduled' AND appointment_date >= date('now') ORDER BY appointment_date LIMIT 3`, [uid]),
    database.get('SELECT COUNT(*) as count FROM notifications WHERE user_id=? AND read=0', [uid])
  ]);
  res.json({ user, latestAssessment, recentRecords, activeMeds, upcomingAppts, unreadCount: unreadNotifs?.count || 0 });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅  Dr. Jigree backend running on http://localhost:${PORT}`));

