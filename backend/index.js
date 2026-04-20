const express     = require('express');
const cors        = require('cors');
const bodyParser  = require('body-parser');
const path        = require('path');
const { PORT }    = require('./config');

// ── Route modules ─────────────────────────────────────────
const authRoutes          = require('./routes/auth');
const profileRoutes       = require('./routes/profile');
const recordsRoutes       = require('./routes/records');
const assessmentRoutes    = require('./routes/assessment');
const medicationsRoutes   = require('./routes/medications');
const appointmentsRoutes  = require('./routes/appointments');
const documentsRoutes     = require('./routes/documents');
const notificationsRoutes = require('./routes/notifications');
const dashboardRoutes     = require('./routes/dashboard');
const adminRoutes         = require('./routes/admin');
const workoutsRoutes      = require('./routes/workouts');

const app = express();

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(bodyParser.json());

// ── Static file serving ───────────────────────────────────
const uploadDir = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadDir));

// ── Health check ──────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', version: '1.0.0' }));

// ── API routes ────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/profile',       profileRoutes);
app.use('/api/health-records', recordsRoutes);
app.use('/api/assess',        assessmentRoutes);
app.use('/api/assessments',   assessmentRoutes);
app.use('/api/medications',   medicationsRoutes);
app.use('/api/appointments',  appointmentsRoutes);
app.use('/api/documents',     documentsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/dashboard',     dashboardRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/workouts',      workoutsRoutes);

app.listen(PORT, () => console.log(`✅  Dr. Jigree backend running on http://localhost:${PORT}`));

