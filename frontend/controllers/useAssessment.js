import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { runAssessment, getAssessments } from '@/services/assessmentService';

export const STEPS = ['Body Metrics', 'Vitals', 'Lifestyle', 'Family & Stress'];

export const INIT = {
  age: '', height_cm: '', weight_kg: '',
  systolic_bp: '', diastolic_bp: '',
  glucose: '', cholesterol: '',
  smoking: false, alcohol: false, exercise_days: '',
  family_history: false, stress_level: 3,
};

export function useAssessment() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [step, setStep]       = useState(0);
  const [form, setForm]       = useState(INIT);
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!ready) return;
    if (!user) { router.push('/login'); return; }
    getAssessments().then(setHistory).catch(() => {});
  }, [ready, user]);

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep(s => Math.max(s - 1, 0));

  const submit = async () => {
    setLoading(true);
    try {
      const payload = {
        ...form,
        age:           Number(form.age),
        height_cm:     Number(form.height_cm),
        weight_kg:     Number(form.weight_kg),
        systolic_bp:   Number(form.systolic_bp)   || undefined,
        diastolic_bp:  Number(form.diastolic_bp)  || undefined,
        glucose:       Number(form.glucose)        || undefined,
        cholesterol:   Number(form.cholesterol)    || undefined,
        exercise_days: Number(form.exercise_days),
        stress_level:  Number(form.stress_level),
      };
      const data = await runAssessment(payload);
      setResult(data);
      const hist = await getAssessments();
      setHistory(hist);
      toast.success('Assessment complete!');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Assessment failed');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setResult(null); setForm(INIT); setStep(0); };

  return { step, form, setForm, loading, result, history, next, back, submit, reset };
}
