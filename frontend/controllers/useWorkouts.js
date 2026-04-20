import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import {
  generatePlan, getActivePlan, deletePlan,
  logWorkout, unlogWorkout, getStats,
} from '@/services/workoutsService';

const WIZARD_DEFAULTS = {
  goal:          '',
  fitness_level: '',
  days_per_week: 4,
  timeline_weeks: 8,
  weight_kg:     '',
  height_cm:     '',
  age:           '',
  gender:        '',
  activity_level: '',
};

export function useWorkouts() {
  const { user, ready } = useAuth();
  const router = useRouter();

  // ── data state ──────────────────────────────────────────────────────────────
  const [plan,    setPlan]    = useState(null);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [logs,    setLogs]    = useState([]);   // current-week logs

  // ── wizard state ─────────────────────────────────────────────────────────────
  const [step,      setStep]      = useState(1);
  const [form,      setForm]      = useState({ ...WIZARD_DEFAULTS });
  const [generating, setGenerating] = useState(false);

  // ── expanded day (for exercise list) ─────────────────────────────────────────
  const [expandedDay, setExpandedDay] = useState(null);

  // ── init ──────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!ready) return;
    if (!user) { router.push('/login'); return; }
    load();
  }, [ready, user]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, s] = await Promise.all([getActivePlan(), getStats()]);
      if (p) {
        setPlan(p);
        setLogs(p.week_logs || []);
      }
      setStats(s);
    } catch { /* no plan yet */ }
    finally { setLoading(false); }
  }, []);

  // ── wizard ────────────────────────────────────────────────────────────────────
  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const nextStep = () => {
    if (step === 1 && !form.goal) { toast.error('Please select a goal'); return; }
    setStep(2);
  };
  const prevStep = () => setStep(1);

  const submitPlan = async () => {
    const { goal, fitness_level, days_per_week, timeline_weeks,
            weight_kg, height_cm, age, gender, activity_level } = form;

    if (!fitness_level || !activity_level || !gender) {
      toast.error('Please complete all fields');
      return;
    }
    if (!weight_kg || !height_cm || !age) {
      toast.error('Weight, height and age are required for calorie calculation');
      return;
    }

    setGenerating(true);
    try {
      const p = await generatePlan({
        goal, fitness_level, days_per_week: parseInt(days_per_week),
        timeline_weeks: parseInt(timeline_weeks),
        weight_kg: parseFloat(weight_kg), height_cm: parseFloat(height_cm),
        age: parseInt(age), gender, activity_level,
      });
      setPlan(p);
      setLogs(p.week_logs || []);
      const [s] = await Promise.all([getStats()]);
      setStats(s);
      toast.success('Workout plan generated!');
      setForm({ ...WIZARD_DEFAULTS });
      setStep(1);
    } catch { toast.error('Failed to generate plan'); }
    finally { setGenerating(false); }
  };

  // ── logging ───────────────────────────────────────────────────────────────────
  const toggleDay = async (dayNumber, dayName) => {
    if (!plan) return;

    const existing = logs.find(
      l => l.day_number === dayNumber && l.week_number === plan.current_week
    );

    if (existing) {
      // Unlog
      try {
        await unlogWorkout(existing.id);
        setLogs(ls => ls.filter(l => l.id !== existing.id));
        setStats(prev => prev ? { ...prev, total_completed: prev.total_completed - 1 } : prev);
      } catch { toast.error('Failed to unlog'); }
    } else {
      // Log
      try {
        const entry = await logWorkout({
          plan_id: plan.id,
          week_number: plan.current_week,
          day_number: dayNumber,
          day_name: dayName,
        });
        setLogs(ls => [...ls, entry]);
        setStats(prev => prev ? { ...prev, total_completed: prev.total_completed + 1 } : prev);
        toast.success('Workout logged!');
      } catch (err) {
        if (err?.response?.status === 409) { toast('Already logged for this week'); }
        else toast.error('Failed to log workout');
      }
    }
  };

  // ── reset (new plan) ──────────────────────────────────────────────────────────
  const newPlan = async () => {
    if (!confirm('Start a new plan? Your current plan and all its logs will be deleted.')) return;
    if (plan) {
      await deletePlan(plan.id);
    }
    setPlan(null);
    setLogs([]);
    setStats(null);
    setStep(1);
    setForm({ ...WIZARD_DEFAULTS });
  };

  // ── derived helpers ───────────────────────────────────────────────────────────
  const isDayDone = (dayNumber) =>
    logs.some(l => l.day_number === dayNumber && l.week_number === plan?.current_week);

  const weekProgress = plan
    ? { done: logs.filter(l => l.week_number === plan.current_week).length, total: plan.days_per_week }
    : { done: 0, total: 0 };

  return {
    // data
    plan, stats, loading, logs,
    // wizard
    step, form, setField, nextStep, prevStep, submitPlan, generating,
    // plan
    toggleDay, isDayDone, weekProgress, newPlan,
    // UI
    expandedDay, setExpandedDay,
  };
}
