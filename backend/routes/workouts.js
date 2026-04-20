const express = require('express');
const db      = require('../db/db');
const auth    = require('../middleware/auth');

const router = express.Router();

// ── Plan generator ────────────────────────────────────────────────────────────
function generatePlan({ goal, fitness_level, days_per_week, weight_kg, height_cm, age, gender, activity_level }) {
  const w = parseFloat(weight_kg) || 70;
  const h = parseFloat(height_cm) || 170;
  const a = parseInt(age)         || 25;

  const bmr = gender === 'female'
    ? 10 * w + 6.25 * h - 5 * a - 161
    : 10 * w + 6.25 * h - 5 * a + 5;

  const actMult = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
  const tdee = Math.round(bmr * (actMult[activity_level] || 1.55));

  const calAdj = { cut: -400, bulk: 350, maintain: 0, athletic: 100 };
  const daily_calories = Math.max(1200, Math.round(tdee + (calAdj[goal] || 0)));

  const macroMap = { cut: [2.2, 0.8], bulk: [2.0, 1.0], maintain: [1.8, 0.9], athletic: [2.0, 0.9] };
  const [protMult, fatMult] = macroMap[goal] || [1.8, 0.9];
  const protein_g = Math.round(w * protMult);
  const fat_g     = Math.round(w * fatMult);
  const carbs_g   = Math.max(50, Math.round((daily_calories - protein_g * 4 - fat_g * 9) / 4));

  // ── Sets/reps per goal + level ──────────────────────────────────────────────
  const SR = {
    cut: {
      beginner:     { c: { sets: 3, reps: '12–15' }, i: { sets: 3, reps: '15–20' }, rest: '45 sec' },
      intermediate: { c: { sets: 4, reps: '12–15' }, i: { sets: 3, reps: '15–20' }, rest: '45 sec' },
      advanced:     { c: { sets: 4, reps: '12–15' }, i: { sets: 4, reps: '15–20' }, rest: '30 sec' },
    },
    bulk: {
      beginner:     { c: { sets: 3, reps: '6–8'   }, i: { sets: 3, reps: '10–12' }, rest: '2 min'  },
      intermediate: { c: { sets: 4, reps: '6–8'   }, i: { sets: 3, reps: '10–12' }, rest: '90 sec' },
      advanced:     { c: { sets: 5, reps: '4–6'   }, i: { sets: 4, reps: '8–10'  }, rest: '2 min'  },
    },
    maintain: {
      beginner:     { c: { sets: 3, reps: '10–12' }, i: { sets: 3, reps: '12–15' }, rest: '60 sec' },
      intermediate: { c: { sets: 4, reps: '8–12'  }, i: { sets: 3, reps: '12–15' }, rest: '60 sec' },
      advanced:     { c: { sets: 4, reps: '8–12'  }, i: { sets: 4, reps: '12–15' }, rest: '60 sec' },
    },
    athletic: {
      beginner:     { c: { sets: 3, reps: '8–10'  }, i: { sets: 3, reps: '12–15' }, rest: '60 sec' },
      intermediate: { c: { sets: 4, reps: '6–10'  }, i: { sets: 3, reps: '10–15' }, rest: '60 sec' },
      advanced:     { c: { sets: 5, reps: '5–8'   }, i: { sets: 4, reps: '10–12' }, rest: '90 sec' },
    },
  };
  const { c, i: iso, rest } = ((SR[goal] || SR.maintain)[fitness_level] || SR.maintain.intermediate);

  // ── Split templates ─────────────────────────────────────────────────────────
  const SPLITS = {
    3: [
      {
        name: 'Full Body A', muscle_groups: ['Chest', 'Back', 'Legs'],
        exercises: [
          { name: 'Barbell Squat',             ...c,   rest },
          { name: 'Bench Press',               ...c,   rest },
          { name: 'Bent-Over Row',             ...c,   rest },
          { name: 'Overhead Press',            ...c,   rest },
          { name: 'Romanian Deadlift',         ...c,   rest },
          { name: 'Plank',                     sets: 3, reps: '45–60 sec', rest },
        ],
      },
      {
        name: 'Full Body B', muscle_groups: ['Legs', 'Shoulders', 'Arms'],
        exercises: [
          { name: 'Deadlift',                  ...c,   rest },
          { name: 'Dumbbell Lunges',           ...c,   rest },
          { name: 'Arnold Press',              ...c,   rest },
          { name: 'Pull-Ups / Lat Pulldown',   ...c,   rest },
          { name: 'Barbell Curl',              ...iso, rest },
          { name: 'Tricep Pushdown',           ...iso, rest },
        ],
      },
      {
        name: 'Full Body C', muscle_groups: ['Chest', 'Core', 'Cardio'],
        exercises: [
          { name: 'Incline Dumbbell Press',    ...c,   rest },
          { name: 'Cable Row',                 ...c,   rest },
          { name: 'Leg Press',                 ...c,   rest },
          { name: 'Lateral Raises',            ...iso, rest },
          { name: 'Crunches',                  sets: 3, reps: '20',      rest },
          { name: 'Treadmill / Cycling',       sets: 1, reps: '20 min',  rest: '—' },
        ],
      },
    ],
    4: [
      {
        name: 'Upper Body A', muscle_groups: ['Chest', 'Back'],
        exercises: [
          { name: 'Bench Press',               ...c,   rest },
          { name: 'Bent-Over Barbell Row',     ...c,   rest },
          { name: 'Incline Dumbbell Press',    ...c,   rest },
          { name: 'Lat Pulldown',              ...c,   rest },
          { name: 'Cable Chest Fly',           ...iso, rest },
          { name: 'Cable Row',                 ...c,   rest },
        ],
      },
      {
        name: 'Lower Body A', muscle_groups: ['Quads', 'Glutes'],
        exercises: [
          { name: 'Barbell Squat',             ...c,   rest },
          { name: 'Leg Press',                 ...c,   rest },
          { name: 'Leg Extension',             ...iso, rest },
          { name: 'Hip Thrust',                ...c,   rest },
          { name: 'Walking Lunges',            ...c,   rest },
          { name: 'Calf Raises',               ...iso, rest },
        ],
      },
      {
        name: 'Upper Body B', muscle_groups: ['Shoulders', 'Arms'],
        exercises: [
          { name: 'Overhead Press',            ...c,   rest },
          { name: 'Arnold Press',              ...c,   rest },
          { name: 'Lateral Raises',            ...iso, rest },
          { name: 'Front Raises',              ...iso, rest },
          { name: 'Barbell Curl',              ...iso, rest },
          { name: 'Skull Crushers',            ...iso, rest },
        ],
      },
      {
        name: 'Lower Body B', muscle_groups: ['Hamstrings', 'Core'],
        exercises: [
          { name: 'Romanian Deadlift',         ...c,   rest },
          { name: 'Leg Curl',                  ...iso, rest },
          { name: 'Sumo Deadlift',             ...c,   rest },
          { name: 'Step-Ups',                  ...c,   rest },
          { name: 'Plank',                     sets: 3, reps: '45–60 sec', rest },
          { name: 'Russian Twists',            sets: 3, reps: '20',        rest },
        ],
      },
    ],
    5: [
      {
        name: 'Chest & Triceps', muscle_groups: ['Chest', 'Triceps'],
        exercises: [
          { name: 'Flat Bench Press',          ...c,   rest },
          { name: 'Incline Dumbbell Press',    ...c,   rest },
          { name: 'Cable Chest Fly',           ...iso, rest },
          { name: 'Dips',                      ...c,   rest },
          { name: 'Skull Crushers',            ...iso, rest },
          { name: 'Tricep Pushdown',           ...iso, rest },
        ],
      },
      {
        name: 'Back & Biceps', muscle_groups: ['Back', 'Biceps'],
        exercises: [
          { name: 'Deadlift',                  ...c,   rest },
          { name: 'Pull-Ups / Lat Pulldown',   ...c,   rest },
          { name: 'Bent-Over Row',             ...c,   rest },
          { name: 'Cable Row',                 ...c,   rest },
          { name: 'Barbell Curl',              ...iso, rest },
          { name: 'Hammer Curl',               ...iso, rest },
        ],
      },
      {
        name: 'Legs', muscle_groups: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
        exercises: [
          { name: 'Barbell Squat',             ...c,   rest },
          { name: 'Romanian Deadlift',         ...c,   rest },
          { name: 'Leg Press',                 ...c,   rest },
          { name: 'Leg Curl',                  ...iso, rest },
          { name: 'Walking Lunges',            ...c,   rest },
          { name: 'Calf Raises',               ...iso, rest },
        ],
      },
      {
        name: 'Shoulders & Arms', muscle_groups: ['Shoulders', 'Biceps', 'Triceps'],
        exercises: [
          { name: 'Overhead Press',            ...c,   rest },
          { name: 'Lateral Raises',            ...iso, rest },
          { name: 'Face Pulls',                ...iso, rest },
          { name: 'Barbell Curl',              ...iso, rest },
          { name: 'Tricep Pushdown',           ...iso, rest },
          { name: 'Arnold Press',              ...c,   rest },
        ],
      },
      {
        name: 'Core & Cardio', muscle_groups: ['Core', 'Cardio'],
        exercises: [
          { name: 'Treadmill Intervals',       sets: 1, reps: '20 min',    rest: '—'   },
          { name: 'Plank',                     sets: 4, reps: '60 sec',    rest: '30 sec' },
          { name: 'Cable Crunch',              sets: 3, reps: '15–20',     rest: '45 sec' },
          { name: 'Hanging Leg Raises',        sets: 3, reps: '12–15',     rest: '45 sec' },
          { name: 'Russian Twists',            sets: 3, reps: '20',        rest: '30 sec' },
          { name: 'Mountain Climbers',         sets: 3, reps: '30 sec',    rest: '30 sec' },
        ],
      },
    ],
    6: [
      {
        name: 'Push A – Chest', muscle_groups: ['Chest', 'Shoulders', 'Triceps'],
        exercises: [
          { name: 'Flat Bench Press',          ...c,   rest },
          { name: 'Incline Dumbbell Press',    ...c,   rest },
          { name: 'Cable Chest Fly',           ...iso, rest },
          { name: 'Overhead Press',            ...c,   rest },
          { name: 'Tricep Pushdown',           ...iso, rest },
          { name: 'Close-Grip Bench Press',    ...c,   rest },
        ],
      },
      {
        name: 'Pull A – Back', muscle_groups: ['Back', 'Biceps', 'Rear Delts'],
        exercises: [
          { name: 'Deadlift',                  ...c,   rest },
          { name: 'Bent-Over Row',             ...c,   rest },
          { name: 'Lat Pulldown',              ...c,   rest },
          { name: 'Cable Row',                 ...c,   rest },
          { name: 'Barbell Curl',              ...iso, rest },
          { name: 'Face Pulls',                ...iso, rest },
        ],
      },
      {
        name: 'Legs A – Quads', muscle_groups: ['Quads', 'Calves', 'Core'],
        exercises: [
          { name: 'Barbell Squat',             ...c,   rest },
          { name: 'Leg Press',                 ...c,   rest },
          { name: 'Leg Extension',             ...iso, rest },
          { name: 'Walking Lunges',            ...c,   rest },
          { name: 'Calf Raises',               ...iso, rest },
          { name: 'Plank',                     sets: 3, reps: '60 sec', rest },
        ],
      },
      {
        name: 'Push B – Shoulders', muscle_groups: ['Shoulders', 'Chest', 'Triceps'],
        exercises: [
          { name: 'Overhead Press',            ...c,   rest },
          { name: 'Arnold Press',              ...c,   rest },
          { name: 'Lateral Raises',            ...iso, rest },
          { name: 'Incline Bench Press',       ...c,   rest },
          { name: 'Skull Crushers',            ...iso, rest },
          { name: 'Dips',                      ...c,   rest },
        ],
      },
      {
        name: 'Pull B – Arms', muscle_groups: ['Biceps', 'Back', 'Forearms'],
        exercises: [
          { name: 'Pull-Ups',                  ...c,   rest },
          { name: 'Single-Arm Dumbbell Row',   ...c,   rest },
          { name: 'Hammer Curl',               ...iso, rest },
          { name: 'Concentration Curl',        ...iso, rest },
          { name: 'Reverse Curl',              ...iso, rest },
          { name: 'Cable Row',                 ...c,   rest },
        ],
      },
      {
        name: 'Legs B – Hamstrings', muscle_groups: ['Hamstrings', 'Glutes', 'Calves'],
        exercises: [
          { name: 'Romanian Deadlift',         ...c,   rest },
          { name: 'Hip Thrust',                ...c,   rest },
          { name: 'Leg Curl',                  ...iso, rest },
          { name: 'Sumo Squat',                ...c,   rest },
          { name: 'Glute Kickback',            ...iso, rest },
          { name: 'Seated Calf Raises',        ...iso, rest },
        ],
      },
    ],
  };

  const dpw = days_per_week >= 6 ? 6 : days_per_week >= 5 ? 5 : days_per_week >= 4 ? 4 : 3;
  const weekly_schedule = SPLITS[dpw].map((day, idx) => ({ day: idx + 1, ...day }));

  return { daily_calories, protein_g, carbs_g, fat_g, weekly_schedule };
}

// Helper: current week number from plan creation date
function currentWeek(createdAt) {
  const ms = Date.now() - new Date(createdAt).getTime();
  return Math.floor(ms / (7 * 24 * 60 * 60 * 1000)) + 1;
}

// ── POST /api/workouts/generate ───────────────────────────────────────────────
router.post('/generate', auth, async (req, res) => {
  const { goal, fitness_level, days_per_week, timeline_weeks,
          weight_kg, height_cm, age, gender, activity_level } = req.body;

  if (!goal || !fitness_level || !days_per_week || !timeline_weeks) {
    return res.status(400).json({ error: 'goal, fitness_level, days_per_week and timeline_weeks are required' });
  }

  const { daily_calories, protein_g, carbs_g, fat_g, weekly_schedule } =
    generatePlan({ goal, fitness_level, days_per_week, weight_kg, height_cm, age, gender, activity_level });

  const database = await db;

  // Deactivate any existing active plan
  await database.run(
    'UPDATE workout_plans SET is_active=0 WHERE user_id=? AND is_active=1',
    [req.user.id]
  );

  const { lastID } = await database.run(
    `INSERT INTO workout_plans
     (user_id, goal, fitness_level, days_per_week, timeline_weeks,
      weight_kg, height_cm, age, gender, activity_level,
      daily_calories, protein_g, carbs_g, fat_g, weekly_schedule)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [req.user.id, goal, fitness_level, days_per_week, timeline_weeks,
     weight_kg, height_cm, age, gender, activity_level,
     daily_calories, protein_g, carbs_g, fat_g, JSON.stringify(weekly_schedule)]
  );

  // Notification
  await database.run(
    `INSERT INTO notifications (user_id, title, message) VALUES (?,?,?)`,
    [req.user.id, 'Workout Plan Created',
     `Your ${goal} plan has been generated — ${days_per_week} days/week for ${timeline_weeks} weeks.`]
  );

  const plan = await database.get('SELECT * FROM workout_plans WHERE id=?', [lastID]);
  plan.weekly_schedule = JSON.parse(plan.weekly_schedule);
  plan.current_week = currentWeek(plan.created_at);

  res.status(201).json(plan);
});

// ── GET /api/workouts/plan ────────────────────────────────────────────────────
router.get('/plan', auth, async (req, res) => {
  const database = await db;
  const plan = await database.get(
    'SELECT * FROM workout_plans WHERE user_id=? AND is_active=1 ORDER BY created_at DESC LIMIT 1',
    [req.user.id]
  );
  if (!plan) return res.json(null);

  plan.weekly_schedule = JSON.parse(plan.weekly_schedule);
  const cw = currentWeek(plan.created_at);
  plan.current_week = cw;

  const week_logs = await database.all(
    'SELECT * FROM workout_logs WHERE plan_id=? AND week_number=? AND user_id=?',
    [plan.id, cw, req.user.id]
  );
  plan.week_logs = week_logs;

  res.json(plan);
});

// ── GET /api/workouts/plans ───────────────────────────────────────────────────
router.get('/plans', auth, async (req, res) => {
  const database = await db;
  const plans = await database.all(
    'SELECT id, goal, fitness_level, days_per_week, timeline_weeks, daily_calories, is_active, created_at FROM workout_plans WHERE user_id=? ORDER BY created_at DESC',
    [req.user.id]
  );
  res.json(plans);
});

// ── DELETE /api/workouts/plan/:id ─────────────────────────────────────────────
router.delete('/plan/:id', auth, async (req, res) => {
  const database = await db;
  await database.run(
    'DELETE FROM workout_plans WHERE id=? AND user_id=?',
    [req.params.id, req.user.id]
  );
  res.json({ success: true });
});

// ── POST /api/workouts/log ────────────────────────────────────────────────────
router.post('/log', auth, async (req, res) => {
  const { plan_id, week_number, day_number, day_name } = req.body;
  if (!plan_id || !week_number || !day_number) {
    return res.status(400).json({ error: 'plan_id, week_number and day_number are required' });
  }

  const database = await db;

  // Verify ownership
  const plan = await database.get(
    'SELECT id, days_per_week, timeline_weeks FROM workout_plans WHERE id=? AND user_id=?',
    [plan_id, req.user.id]
  );
  if (!plan) return res.status(404).json({ error: 'Plan not found' });

  // Prevent duplicate log for the same day in same week
  const existing = await database.get(
    'SELECT id FROM workout_logs WHERE plan_id=? AND week_number=? AND day_number=? AND user_id=?',
    [plan_id, week_number, day_number, req.user.id]
  );
  if (existing) return res.status(409).json({ error: 'Already logged' });

  const { lastID } = await database.run(
    'INSERT INTO workout_logs (user_id, plan_id, week_number, day_number, day_name) VALUES (?,?,?,?,?)',
    [req.user.id, plan_id, week_number, day_number, day_name || '']
  );

  const log = await database.get('SELECT * FROM workout_logs WHERE id=?', [lastID]);
  res.status(201).json(log);
});

// ── DELETE /api/workouts/log/:id ──────────────────────────────────────────────
router.delete('/log/:id', auth, async (req, res) => {
  const database = await db;
  await database.run(
    'DELETE FROM workout_logs WHERE id=? AND user_id=?',
    [req.params.id, req.user.id]
  );
  res.json({ success: true });
});

// ── GET /api/workouts/stats ───────────────────────────────────────────────────
router.get('/stats', auth, async (req, res) => {
  const database = await db;
  const plan = await database.get(
    'SELECT * FROM workout_plans WHERE user_id=? AND is_active=1 ORDER BY created_at DESC LIMIT 1',
    [req.user.id]
  );
  if (!plan) return res.json({ total_completed: 0, weeks_on_track: 0, current_streak: 0, current_week: 1, all_weeks: [] });

  const cw   = currentWeek(plan.created_at);
  const logs = await database.all(
    'SELECT week_number, day_number FROM workout_logs WHERE plan_id=? AND user_id=?',
    [plan.id, req.user.id]
  );

  // Group by week
  const weekMap = {};
  for (const log of logs) {
    if (!weekMap[log.week_number]) weekMap[log.week_number] = new Set();
    weekMap[log.week_number].add(log.day_number);
  }

  const all_weeks = [];
  for (let w = 1; w <= cw; w++) {
    const completed   = weekMap[w] ? weekMap[w].size : 0;
    const in_progress = w === cw;
    all_weeks.push({
      week: w,
      completed,
      total: plan.days_per_week,
      on_track: !in_progress && completed >= plan.days_per_week,
      in_progress,
    });
  }

  const weeks_on_track = all_weeks.filter(w => !w.in_progress && w.on_track).length;

  // Streak: consecutive on-track weeks going backwards from most recently elapsed week
  let current_streak = 0;
  for (let i = all_weeks.length - 2; i >= 0; i--) {
    if (all_weeks[i].on_track) current_streak++;
    else break;
  }

  res.json({
    total_completed: logs.length,
    weeks_on_track,
    current_streak,
    current_week: cw,
    timeline_weeks: plan.timeline_weeks,
    all_weeks,
  });
});

module.exports = router;
