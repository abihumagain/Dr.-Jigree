import { useState } from 'react';

export default function Home() {
  const [form, setForm] = useState({ age: '', height_cm: '', weight_kg: '', smoking: false });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    const res = await fetch('/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  };

  return (
    <main style={{ maxWidth: 400, margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h1>Health Risk Portfolio</h1>
      <form onSubmit={handleSubmit}>
        <label>Age:<br /><input name="age" type="number" value={form.age} onChange={handleChange} required /></label><br />
        <label>Height (cm):<br /><input name="height_cm" type="number" value={form.height_cm} onChange={handleChange} required /></label><br />
        <label>Weight (kg):<br /><input name="weight_kg" type="number" value={form.weight_kg} onChange={handleChange} required /></label><br />
        <label><input name="smoking" type="checkbox" checked={form.smoking} onChange={handleChange} /> Smoker</label><br />
        <button type="submit" disabled={loading}>{loading ? 'Predicting...' : 'Get Risk Score'}</button>
      </form>
      {result && (
        <div style={{ marginTop: 20 }}>
          <h2>Result</h2>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </main>
  );
}
