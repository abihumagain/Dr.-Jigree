import Layout from '@/components/Layout';
import { useAssessment, STEPS } from '@/controllers/useAssessment';
import {
  ChevronRight, ChevronLeft, Loader2, CheckCircle2, AlertTriangle,
  Activity, TrendingUp, Info, RefreshCw
} from 'lucide-react';

function StepDots({ step }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors
            ${i < step ? 'bg-brand-500 text-white' : i === step ? 'bg-brand-500 text-white ring-4 ring-brand-500/20' : 'bg-navy-700 text-slate-400'}`}>
            {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
          </div>
          {i < STEPS.length - 1 && <div className={`h-0.5 w-8 ${i < step ? 'bg-brand-500' : 'bg-navy-600'}`} />}
        </div>
      ))}
      <span className="ml-3 text-sm font-medium text-slate-300">{STEPS[step]}</span>
    </div>
  );
}

function Field({ label, name, type = 'number', form, setForm, hint, min, max, placeholder }) {
  return (
    <div>
      <label className="label">{label}{hint && <span className="text-slate-400 font-normal ml-1">({hint})</span>}</label>
      <input className="input" type={type} name={name} min={min} max={max} placeholder={placeholder}
        value={form[name]} onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))} />
    </div>
  );
}

function Toggle({ label, name, form, setForm, description }) {
  return (
    <div className="flex items-start justify-between gap-4 p-3 rounded-xl bg-navy-700 border border-navy-600">
      <div>
        <p className="font-medium text-sm text-slate-200">{label}</p>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
      <button type="button"
        onClick={() => setForm(f => ({ ...f, [name]: !f[name] }))}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${form[name] ? 'bg-brand-500' : 'bg-navy-600'}`}>
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
  const { step, form, setForm, loading, result, history, next, back, submit, reset } = useAssessment();

  const riskColor = r => r === 'High' ? 'text-red-400' : r === 'Moderate' ? 'text-yellow-400' : 'text-green-400';
  const riskBg    = r => r === 'High' ? 'bg-red-900/20 border-red-700' : r === 'Moderate' ? 'bg-yellow-900/20 border-yellow-700' : 'bg-green-900/20 border-green-700';

  return (
    <Layout title="Health Risk Assessment">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-100">Health Risk Assessment</h2>
          <p className="text-slate-400 text-sm mt-1">Complete the form to receive your personalised health risk score and recommendations.</p>
        </div>

        {/* Result view */}
        {result && (
          <div className={`card border-2 mb-6 ${riskBg(result.risk)}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {result.risk === 'High' ? <AlertTriangle className="w-6 h-6 text-red-500" />
                  : <CheckCircle2 className="w-6 h-6 text-green-500" />}
                <div>
                  <p className="text-sm text-slate-300">Your Risk Level</p>
                  <p className={`text-3xl font-extrabold ${riskColor(result.risk)}`}>{result.risk} Risk</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-4xl font-extrabold text-slate-100">{result.score_percent}%</p>
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
              <h4 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Personalised Recommendations
              </h4>
              <ul className="space-y-2">
                {(result.recommendations || []).map((r, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-xs font-bold shrink-0">{i+1}</span>
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
                <Field label="Age" name="age" form={form} setForm={setForm} hint="years" min="1" max="120" placeholder="e.g. 35" />
                <Field label="Height" name="height_cm" form={form} setForm={setForm} hint="cm" min="50" max="250" placeholder="avg. 170" />
                <Field label="Weight" name="weight_kg" form={form} setForm={setForm} hint="kg" min="10" max="300" placeholder="avg. 70" />
              </div>
            )}

            {step === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Systolic Blood Pressure" name="systolic_bp" form={form} setForm={setForm} hint="mmHg" min="60" max="260" placeholder="avg. 120" />
                <Field label="Diastolic Blood Pressure" name="diastolic_bp" form={form} setForm={setForm} hint="mmHg" min="40" max="160" placeholder="avg. 80" />
                <Field label="Fasting Glucose" name="glucose" form={form} setForm={setForm} hint="mg/dL" min="40" max="600" placeholder="avg. 90" />
                <Field label="Total Cholesterol" name="cholesterol" form={form} setForm={setForm} hint="mg/dL" min="50" max="500" placeholder="avg. 190" />
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
                  <input className="input" type="number" name="exercise_days" min="0" max="7" placeholder="avg. 3–4 days"
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
                  <label className="label">Stress Level: <span className="font-bold text-brand-400">{form.stress_level}/5</span></label>
                  <input type="range" min="1" max="5" step="1" className="w-full accent-brand-500"
                    value={form.stress_level} onChange={e => setForm(f => ({...f, stress_level: e.target.value}))} />
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>Very low</span><span>Moderate</span><span>Very high</span>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6 pt-5 border-t border-navy-600">
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
            <h3 className="font-semibold text-slate-100 mb-4">Assessment History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-navy-600 text-xs text-slate-400 uppercase">
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">Risk</th>
                    <th className="text-left py-2">Score</th>
                    <th className="text-left py-2">BMI</th>
                    <th className="text-left py-2">BP</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(h => (
                    <tr key={h.id} className="border-b border-navy-700/50 hover:bg-navy-700">
                      <td className="py-2 text-slate-400">{new Date(h.assessed_at).toLocaleDateString()}</td>
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
