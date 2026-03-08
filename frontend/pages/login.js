import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { HeartPulse, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.token, data.user);
      toast.success(`Welcome back, ${data.user.full_name}!`);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-lg shadow-brand-500/30 mb-3">
            <HeartPulse className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Dr. Jigree</h1>
          <p className="text-slate-400 text-sm mt-1">Your personal health portfolio</p>
        </div>

        {/* Card */}
        <div className="card shadow-xl shadow-black/40">
          <h2 className="text-xl font-bold text-slate-100 mb-6">Sign in to your account</h2>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input className="input" type="email" name="email" value={form.email}
                onChange={handle} placeholder="you@example.com" required />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input className="input pr-10" type={showPwd ? 'text' : 'password'}
                  name="password" value={form.password} onChange={handle}
                  placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 mt-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <p className="text-center text-sm text-slate-400 mt-5">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-brand-400 font-medium hover:underline">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
