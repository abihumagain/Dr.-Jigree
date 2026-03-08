import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  ChevronRight, ChevronLeft, Loader2, CheckCircle2, AlertTriangle,
  Activity, TrendingUp, Info, RefreshCw
} from 'lucide-react';

const STEPS = ['Body Metrics', 'Vitals', 'Lifestyle', 'Family & Stress'];

const INIT = {
  age: '', height_cm: '', weight_kg: '',
  systolic_bp: '', diastolic_bp: '',
  glucose: '', cholesterol: '',
  smoking: false, alcohol: false, exercise_days: '',
  family_history: false, stress_level: 3,
};

function StepDots({ step }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors
            ${i < step ? 'bg-blue-600 text-white' : i === step ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-slate-200 text-slate-500'}`}>
            {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
          </div>
          {i < STEPS.length - 1 && <div className={`h-0.5 w-8 ${i < step ? 'bg-blue-500' : 'bg-slate-200'}`} />}
        </div>
      ))}
      <span className="ml-3 text-sm font-medium text-slate-600">{STEPS[step]}</span>
    </div>
  );
}

function Field({ label, name, type = 'number', form, setForm, hint, min, max }) {
  return (
    <div>
      <label className="label">{label}{hint && <span className="text-slate-400 font-normal ml-1">({hint})</span>}</label>
      <input className="input" type={type} name={name} min={min} max={max}
        value={form[name]} onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))} />
    </div>
  );
}

function Toggle({ label, name, form, setForm, description }) {
  return (
    <div className="flex items-start justify-between gap-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
      <div>
        <p className="font-medium text-sm">{label}</p>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
      <button type="button"
        onClick={() => setForm(f => ({ ...f, [name]: !f[name] }))}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${form[name] ? 'bg-blue-600' : 'bg-slate-300'}`}>
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition mt-0.5 ${form[name] ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

function IndicatorBadge({ label, status }) {
  const cls = status === 'High' || status === 'Poor' || status === 'Obese' ? 'badge-high'
    : status === 'Elevated' || status === 'Borderline' || status === 'Overweight' || status === 'Fair' ? 'badge-moderate'
    : 'badge-low';
  return <span className={cls}>{label}: {status}</span>;
}

export default function Assessment() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [step, setStep]     = useState(0);
  const [form, setForm]     = useState(INIT);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!ready) return;
    if (!user) { router.push('/login'); return; }
    api.get('/assessments').then(r => setHistory(r.data)).catch(() => {});
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
        systolic_bp:   Number(form.systolic_bp) || undefined,
        diastolic_bp:  Number(form.diastolic_bp) || undefined,
        glucose:       Number(form.glucose) || undefined,
        cholesterol:   Number(form.cholesterol) || undefined,
        exercise_days: Number(form.exercise_days),
        stress_level:  Number(form.stress_level),
      };
      const { data } = await api.post('/assess', payload);
      setResult(data);
      const hist = await api.get('/assessments');
      setHistory(hist.data);
      toast.success('Assessment complete!');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Assessment failed');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setResult(null); setForm(INIT); setStep(0); };

  const riskColor = r => r === 'High' ? 'text-red-600' : r === 'Moderate' ? 'text-yellow-600' : 'text-green-600';
  const riskBg    = r => r === 'High' ? 'bg-red-50 border-red-200' : r === 'Moderate' ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200';

  return (
    <Layout title="Health Risk Assessment">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Health Risk Assessment</h2>
          <p className="text-slate-500 text-sm mt-1">Complete the form to receive your personalised health risk score and recommendations.</p>
        </div>

        {/* Result view */}
        {result && (
          <div className={`card border-2 mb-6 ${riskBg(result.risk)}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {result.risk === 'High' ? <AlertTriangle className="w-6 h-6 text-red-500" />
                  : <CheckCircle2 className="w-6 h-6 text-green-500" />}
                <div>
                  <p className="text-sm text-slate-500">Your Risk Level</p>
                  <p className={`text-3xl font-extrabold ${riskColor(result.risk)}`}>{result.risk} Risk</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-4xl font-extrabold text-slate-800">{result.score_percent}%</p>
                <p className="text-xs text-slate-400">Risk score</p>
              </div>
            </div>

            {/* Indicators */}
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(result.indicators || {}).map(([k, v]) => (
                <IndicatorBadge key={k} label={k.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())} status={v} />
              ))}
              <span className="badge-low">BMI: {result.bmi} ({result.bmi_category})</span>
            </div>

            {/* Recommendations */}
            <div>
              <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Personalised Recommendations
              </h4>
              <ul className="space-y-2">
                {(result.recommendations || []).map((r, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-700">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">{i+1}</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>

            {!result.ml_model_used && (
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                <Info className="w-3 h-3" /> Results based on clinical rules. Train the ML model for AI-powered predictions.
              </div>
            )}

            <button onClick={reset} className="btn-secondary mt-5 flex items-center gap-2 text-sm">
              <RefreshCw className="w-4 h-4" /> New Assessment
            </button>
          </div>
        )}

        {/* Form */}
        {!result && (
          <div className="card">
            <StepDots step={step} />

            {step === 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Age" name="age" form={form} setForm={setForm} hint="years" min="1" max="120" />
                <Field label="Height" name="height_cm" form={form} setForm={setForm} hint="cm" min="50" max="250" />
                <Field label="Weight" name="weight_kg" form={form} setForm={setForm} hint="kg" min="10" max="300" />
              </div>
            )}

            {step === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Systolic Blood Pressure" name="systolic_bp" form={form} setForm={setForm} hint="mmHg" min="60" max="260" />
                <Field label="Diastolic Blood Pressure" name="diastolic_bp" form={form} setForm={setForm} hint="mmHg" min="40" max="160" />
                <Field label="Fasting Glucose" name="glucose" form={form} setForm={setForm} hint="mg/dL" min="40" max="600" />
                <Field label="Total Cholesterol" name="cholesterol" form={form} setForm={setForm} hint="mg/dL" min="50" max="500" />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <Toggle label="Current Smoker" name="smoking" form={form} setForm={setForm}
                  description="Do you currently smoke cigarettes or other tobacco?" />
                <Toggle label="Regular Alcohol Consumption" name="alcohol" form={form} setForm={setForm}
                  description="Do you drink alcohol more than the recommended guidelines?" />
                <div>
                  <label className="label">Exercise days per week</label>
                  <input className="input" type="number" name="exercise_days" min="0" max="7"
                    value={form.exercise_days} onChange={e => setForm(f => ({...f, exercise_days: e.target.value}))} />
                  <p className="text-xs text-slate-400 mt-1">Number of days you do at least 30 minutes of moderate exercise</p>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <Toggle label="Family History of Heart Disease / Diabetes" name="family_history" form={form} setForm={setForm}
                  description="Do you have a first-degree relative with cardiovascular disease or type 2 diabetes?" />
                <div>
                  <label className="label">Stress Level: <span className="font-bold text-blue-600">{form.stress_level}/5</span></label>
                  <input type="range" min="1" max="5" step="1" className="w-full accent-blue-600"
                    value={form.stress_level} onChange={e => setForm(f => ({...f, stress_level: e.target.value}))} />
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>Very low</span><span>Moderate</span><span>Very high</span>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6 pt-5 border-t border-slate-100">
              <button onClick={back} disabled={step === 0}
                className="btn-secondary flex items-center gap-2 disabled:opacity-30">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              {step < STEPS.length - 1 ? (
                <button onClick={next} className="btn-primary flex items-center gap-2">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={submit} disabled={loading || !form.age || !form.height_cm || !form.weight_kg}
                  className="btn-primary flex items-center gap-2">
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? 'Analysing…' : 'Get Risk Score'}
                  {!loading && <Activity className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Assessment history */}
        {history.length > 0 && (
          <div className="card mt-6">
            <h3 className="font-semibold text-slate-800 mb-4">Assessment History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs text-slate-500 uppercase">
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">Risk</th>
                    <th className="text-left py-2">Score</th>
                    <th className="text-left py-2">BMI</th>
                    <th className="text-left py-2">BP</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(h => (
                    <tr key={h.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-2 text-slate-500">{new Date(h.assessed_at).toLocaleDateString()}</td>
                      <td className="py-2">
                        <span className={h.risk_label === 'High' ? 'badge-high' : h.risk_label === 'Moderate' ? 'badge-moderate' : 'badge-low'}>
                          {h.risk_label}
                        </span>
                      </td>
                      <td className="py-2 font-medium">{h.risk_score ? Math.round(h.risk_score * 100) + '%' : '—'}</td>
                      <td className="py-2">{h.bmi || '—'}</td>
                      <td className="py-2">{h.systolic_bp ? `${h.systolic_bp}/${h.diastolic_bp}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
