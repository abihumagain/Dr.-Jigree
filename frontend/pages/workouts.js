import Layout from '@/components/Layout';
import { useWorkouts } from '@/controllers/useWorkouts';
import {
  Loader2, Dumbbell, Flame, ChevronDown, ChevronUp,
  CheckCircle2, Circle, RotateCcw, TrendingUp,
  Calendar, Award, Zap, Target, Apple,
} from 'lucide-react';

// ── Constants ──────────────────────────────────────────────────────────────────
const GOALS = [
  {
    key: 'cut',
    label: 'Cut / Shredding',
    icon: Flame,
    desc: 'Lose body fat while preserving lean muscle.',
    color: 'from-blue-500/20 to-blue-600/10 border-blue-500/40 text-blue-400',
    badge: 'bg-blue-500/20 text-blue-300',
  },
  {
    key: 'bulk',
    label: 'Bulk / Build Mass',
    icon: Dumbbell,
    desc: 'Gain strength and muscle size with a caloric surplus.',
    color: 'from-green-500/20 to-green-600/10 border-green-500/40 text-green-400',
    badge: 'bg-green-500/20 text-green-300',
  },
  {
    key: 'maintain',
    label: 'Maintenance',
    icon: Target,
    desc: 'Stay fit, maintain current physique and energy levels.',
    color: 'from-violet-500/20 to-violet-600/10 border-violet-500/40 text-violet-400',
    badge: 'bg-violet-500/20 text-violet-300',
  },
  {
    key: 'athletic',
    label: 'Athletic Performance',
    icon: Zap,
    desc: 'Improve speed, power and overall athletic conditioning.',
    color: 'from-amber-500/20 to-amber-600/10 border-amber-500/40 text-amber-400',
    badge: 'bg-amber-500/20 text-amber-300',
  },
];

const GOAL_META = Object.fromEntries(GOALS.map(g => [g.key, g]));

const ACTIVITY_OPTS = [
  { key: 'sedentary',   label: 'Sedentary',    desc: 'Little or no exercise' },
  { key: 'light',       label: 'Light',         desc: '1–3 days/week' },
  { key: 'moderate',    label: 'Moderate',      desc: '3–5 days/week' },
  { key: 'active',      label: 'Active',        desc: '6–7 days/week' },
  { key: 'very_active', label: 'Very Active',   desc: 'Athlete / physical job' },
];

const MUSCLE_COLORS = {
  Chest:      'bg-red-500/15 text-red-300',
  Back:       'bg-blue-500/15 text-blue-300',
  Legs:       'bg-green-500/15 text-green-300',
  Quads:      'bg-green-500/15 text-green-300',
  Hamstrings: 'bg-teal-500/15 text-teal-300',
  Glutes:     'bg-emerald-500/15 text-emerald-300',
  Shoulders:  'bg-yellow-500/15 text-yellow-300',
  Arms:       'bg-orange-500/15 text-orange-300',
  Biceps:     'bg-orange-500/15 text-orange-300',
  Triceps:    'bg-amber-500/15 text-amber-300',
  Core:       'bg-purple-500/15 text-purple-300',
  Cardio:     'bg-pink-500/15 text-pink-300',
  Calves:     'bg-cyan-500/15 text-cyan-300',
  Forearms:   'bg-lime-500/15 text-lime-300',
  default:    'bg-navy-600 text-slate-300',
};
function muscleColor(m) { return MUSCLE_COLORS[m] || MUSCLE_COLORS.default; }

// ── Sub-components ─────────────────────────────────────────────────────────────

function StepDots({ step }) {
  return (
    <div className="flex items-center gap-2 justify-center mb-8">
      {[1, 2].map(s => (
        <div key={s} className={`h-2 rounded-full transition-all ${s === step ? 'w-8 bg-brand-500' : 'w-2 bg-navy-600'}`} />
      ))}
    </div>
  );
}

function SelectPill({ value, current, onClick, children }) {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
        current === value
          ? 'bg-brand-500 border-brand-500 text-white'
          : 'bg-navy-700 border-navy-600 text-slate-300 hover:border-brand-500/50'
      }`}
    >
      {children}
    </button>
  );
}

// Step 1 — Goal selection
function StepGoal({ form, setField, nextStep }) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-500/30">
          <Dumbbell className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white">What is your body goal?</h2>
        <p className="text-slate-400 text-sm mt-1">We'll build a personalised weekly routine around this.</p>
      </div>

      <StepDots step={1} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {GOALS.map(({ key, label, icon: Icon, desc, color }) => (
          <button
            key={key}
            type="button"
            onClick={() => setField('goal', key)}
            className={`card bg-gradient-to-br border-2 text-left transition-all hover:scale-[1.02] ${
              form.goal === key ? color + ' ring-2 ring-offset-2 ring-offset-navy-800 ring-brand-500' : 'border-navy-600 hover:border-navy-500'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${form.goal === key ? '' : 'bg-navy-700'}`}>
              <Icon className={`w-5 h-5 ${form.goal === key ? '' : 'text-slate-400'}`} />
            </div>
            <p className="font-semibold text-slate-100 mb-1">{label}</p>
            <p className="text-xs text-slate-400">{desc}</p>
          </button>
        ))}
      </div>

      <div className="flex justify-end">
        <button onClick={nextStep} disabled={!form.goal}
          className="btn-primary px-8 disabled:opacity-40 disabled:cursor-not-allowed">
          Next →
        </button>
      </div>
    </div>
  );
}

// Step 2 — Details
function StepDetails({ form, setField, prevStep, submitPlan, generating }) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white">Tell us about yourself</h2>
        <p className="text-slate-400 text-sm mt-1">Used to calculate your daily calorie target and macros.</p>
      </div>

      <StepDots step={2} />

      <div className="space-y-6">
        {/* Body stats */}
        <div className="card">
          <p className="text-sm font-semibold text-slate-300 mb-4">Body Stats</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: 'weight_kg', label: 'Weight (kg)',  placeholder: '70' },
              { key: 'height_cm', label: 'Height (cm)',  placeholder: '175' },
              { key: 'age',       label: 'Age',          placeholder: '25' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-xs text-slate-400 mb-1">{label}</label>
                <input
                  type="number" min="0" placeholder={placeholder}
                  value={form[key]}
                  onChange={e => setField(key, e.target.value)}
                  className="input w-full"
                />
              </div>
            ))}
          </div>

          <div className="mt-4">
            <label className="block text-xs text-slate-400 mb-2">Gender</label>
            <div className="flex gap-2 flex-wrap">
              {['male', 'female', 'other'].map(g => (
                <SelectPill key={g} value={g} current={form.gender} onClick={v => setField('gender', v)}>
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </SelectPill>
              ))}
            </div>
          </div>
        </div>

        {/* Activity level */}
        <div className="card">
          <p className="text-sm font-semibold text-slate-300 mb-4">Activity Level</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ACTIVITY_OPTS.map(({ key, label, desc }) => (
              <button
                key={key} type="button"
                onClick={() => setField('activity_level', key)}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  form.activity_level === key
                    ? 'border-brand-500 bg-brand-500/10'
                    : 'border-navy-600 bg-navy-700/50 hover:border-navy-500'
                }`}
              >
                <div className={`w-3 h-3 rounded-full shrink-0 ${form.activity_level === key ? 'bg-brand-500' : 'bg-navy-500'}`} />
                <div>
                  <p className="text-sm font-medium text-slate-200">{label}</p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Training preferences */}
        <div className="card">
          <p className="text-sm font-semibold text-slate-300 mb-4">Training Preferences</p>

          <div className="mb-4">
            <label className="block text-xs text-slate-400 mb-2">Fitness Level</label>
            <div className="flex gap-2 flex-wrap">
              {['beginner', 'intermediate', 'advanced'].map(l => (
                <SelectPill key={l} value={l} current={form.fitness_level} onClick={v => setField('fitness_level', v)}>
                  {l.charAt(0).toUpperCase() + l.slice(1)}
                </SelectPill>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs text-slate-400 mb-2">Days per week</label>
            <div className="flex gap-2">
              {[3, 4, 5, 6].map(d => (
                <SelectPill key={d} value={d} current={form.days_per_week} onClick={v => setField('days_per_week', v)}>
                  {d}
                </SelectPill>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-2">Timeline</label>
            <div className="flex gap-2 flex-wrap">
              {[
                { v: 4,  l: '4 weeks'  },
                { v: 8,  l: '8 weeks'  },
                { v: 12, l: '12 weeks' },
                { v: 16, l: '16 weeks' },
              ].map(({ v, l }) => (
                <SelectPill key={v} value={v} current={form.timeline_weeks} onClick={val => setField('timeline_weeks', val)}>
                  {l}
                </SelectPill>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button onClick={prevStep} className="btn-secondary px-6">← Back</button>
        <button onClick={submitPlan} disabled={generating}
          className="btn-primary px-8 flex items-center gap-2 disabled:opacity-40">
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Dumbbell className="w-4 h-4" />}
          {generating ? 'Generating…' : 'Generate My Plan'}
        </button>
      </div>
    </div>
  );
}

// Calorie / macro strip
function MacroStrip({ plan }) {
  const { daily_calories, protein_g, carbs_g, fat_g } = plan;
  const total = protein_g * 4 + carbs_g * 4 + fat_g * 9;
  const pPct  = Math.round((protein_g * 4 / total) * 100);
  const cPct  = Math.round((carbs_g * 4 / total) * 100);
  const fPct  = 100 - pPct - cPct;

  return (
    <div className="card bg-gradient-to-r from-navy-800 to-navy-750 border border-navy-700 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Calories */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center">
            <Apple className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{daily_calories.toLocaleString()}</p>
            <p className="text-xs text-slate-400">kcal / day</p>
          </div>
        </div>

        {/* Macro bars */}
        <div className="flex-1 min-w-[200px]">
          <div className="flex gap-1 h-2 rounded-full overflow-hidden mb-2">
            <div className="bg-blue-500  rounded-l-full" style={{ width: `${pPct}%` }} />
            <div className="bg-amber-400"                style={{ width: `${cPct}%` }} />
            <div className="bg-rose-400  rounded-r-full" style={{ width: `${fPct}%` }} />
          </div>
          <div className="flex gap-4 text-xs text-slate-400">
            <span><span className="text-blue-400 font-semibold">{protein_g}g</span> protein</span>
            <span><span className="text-amber-400 font-semibold">{carbs_g}g</span> carbs</span>
            <span><span className="text-rose-400 font-semibold">{fat_g}g</span> fat</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Weekly day card
function DayCard({ day, done, onToggle, expanded, onExpand }) {
  const Icon = done ? CheckCircle2 : Circle;

  return (
    <div className={`card border-l-4 transition-all ${done ? 'border-accent-400 bg-accent-500/5' : 'border-navy-600'}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${done ? 'bg-accent-500/20 text-accent-400' : 'bg-navy-700 text-slate-400'}`}>
            {day.day}
          </div>
          <div>
            <p className={`font-semibold text-sm ${done ? 'text-accent-300' : 'text-slate-100'}`}>{day.name}</p>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {day.muscle_groups.map(m => (
                <span key={m} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${muscleColor(m)}`}>{m}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onToggle}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
              done
                ? 'bg-accent-500/20 text-accent-400 hover:bg-red-500/10 hover:text-red-400'
                : 'bg-brand-500/10 text-brand-400 hover:bg-brand-500/20'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {done ? 'Done' : 'Mark Done'}
          </button>
        </div>
      </div>

      {/* Exercise count + expand */}
      <button
        onClick={onExpand}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
      >
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        {day.exercises.length} exercises
      </button>

      {/* Exercise list */}
      {expanded && (
        <div className="mt-3 border-t border-navy-700 pt-3 space-y-2">
          {day.exercises.map((ex, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-slate-300">{ex.name}</span>
              <span className="text-slate-500 shrink-0 ml-2">{ex.sets} × {ex.reps} · {ex.rest}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Progress stats bar
function ProgressBar({ done, total, label }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="mb-1">
      {label && (
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>{label}</span>
          <span>{done}/{total}</span>
        </div>
      )}
      <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-brand-500 to-accent-500 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// Stats section
function StatsSection({ stats, weekProgress }) {
  if (!stats) return null;
  const { total_completed, weeks_on_track, current_streak, current_week, timeline_weeks } = stats;

  return (
    <div className="mt-8">
      <h3 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-brand-400" /> Your Progress
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Days Completed', value: total_completed,  icon: CheckCircle2, color: 'text-accent-400' },
          { label: 'Weeks on Track', value: weeks_on_track,   icon: Calendar,     color: 'text-brand-400'  },
          { label: 'Current Streak', value: `${current_streak}w`, icon: Award,   color: 'text-amber-400'  },
          { label: 'Week',           value: `${current_week}/${timeline_weeks}`, icon: Target, color: 'text-violet-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card text-center py-4">
            <Icon className={`w-5 h-5 mx-auto mb-2 ${color}`} />
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Week history */}
      {stats.all_weeks?.length > 1 && (
        <div className="card">
          <p className="text-sm font-semibold text-slate-300 mb-4">Weekly History</p>
          <div className="space-y-2.5">
            {stats.all_weeks.map(w => (
              <div key={w.week} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-14 shrink-0">Week {w.week}</span>
                <div className="flex-1">
                  <ProgressBar done={w.completed} total={w.total} />
                </div>
                {w.in_progress ? (
                  <span className="text-[10px] text-brand-400 w-16 text-right shrink-0">In progress</span>
                ) : w.on_track ? (
                  <span className="text-[10px] text-accent-400 w-16 text-right shrink-0">✓ On track</span>
                ) : (
                  <span className="text-[10px] text-slate-600 w-16 text-right shrink-0">Missed</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function Workouts() {
  const ctrl = useWorkouts();
  const {
    plan, stats, loading, step, form, setField,
    nextStep, prevStep, submitPlan, generating,
    toggleDay, isDayDone, weekProgress, newPlan,
    expandedDay, setExpandedDay,
  } = ctrl;

  if (loading) {
    return (
      <Layout title="Workout Plan">
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      </Layout>
    );
  }

  // ── Setup wizard ──────────────────────────────────────────────────────────────
  if (!plan) {
    return (
      <Layout title="Workout Plan">
        <div className="max-w-3xl mx-auto py-4">
          {step === 1 && <StepGoal form={form} setField={setField} nextStep={nextStep} />}
          {step === 2 && (
            <StepDetails
              form={form} setField={setField}
              prevStep={prevStep} submitPlan={submitPlan} generating={generating}
            />
          )}
        </div>
      </Layout>
    );
  }

  // ── Plan view ─────────────────────────────────────────────────────────────────
  const goalMeta = GOAL_META[plan.goal] || GOAL_META.maintain;
  const GoalIcon = goalMeta.icon;

  return (
    <Layout title="Workout Plan">
      <div className="max-w-5xl mx-auto">

        {/* Plan header */}
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold text-slate-100">Workout Plan</h2>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize flex items-center gap-1 ${goalMeta.badge}`}>
                <GoalIcon className="w-3 h-3" /> {goalMeta.label}
              </span>
            </div>
            <p className="text-slate-400 text-sm">
              {plan.days_per_week} days/week · {plan.timeline_weeks} weeks · {plan.fitness_level}
              &nbsp;·&nbsp; Week <span className="text-brand-400 font-semibold">{plan.current_week}</span> of {plan.timeline_weeks}
            </p>
          </div>
          <button onClick={newPlan}
            className="btn-secondary flex items-center gap-2 text-sm">
            <RotateCcw className="w-4 h-4" /> New Plan
          </button>
        </div>

        {/* Calorie / macro strip */}
        <MacroStrip plan={plan} />

        {/* Week progress */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-300">
              This week — Week {plan.current_week}
            </p>
            <p className="text-sm font-semibold text-brand-400">
              {weekProgress.done}/{weekProgress.total} days done
            </p>
          </div>
          <ProgressBar done={weekProgress.done} total={weekProgress.total} />
          {weekProgress.done === weekProgress.total && weekProgress.total > 0 && (
            <p className="text-xs text-accent-400 mt-2 font-medium flex items-center gap-1">
              <Award className="w-3.5 h-3.5" /> Full week complete — great work!
            </p>
          )}
        </div>

        {/* Weekly schedule */}
        <div className="mb-2">
          <h3 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-brand-400" /> Weekly Schedule
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {plan.weekly_schedule.map(day => (
              <DayCard
                key={day.day}
                day={day}
                done={isDayDone(day.day)}
                onToggle={() => toggleDay(day.day, day.name)}
                expanded={expandedDay === day.day}
                onExpand={() => setExpandedDay(expandedDay === day.day ? null : day.day)}
              />
            ))}
          </div>
        </div>

        {/* Stats */}
        <StatsSection stats={stats} weekProgress={weekProgress} />
      </div>
    </Layout>
  );
}
