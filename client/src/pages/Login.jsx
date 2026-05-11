import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Bot, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-rose-400/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative animate-slide-up">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-xl shadow-brand-500/30 mb-6 transform transition-transform hover:scale-105 hover:rotate-3">
            <Bot size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-text-main tracking-tight">Welcome back</h1>
          <p className="text-text-muted mt-3 text-base">Sign in to your Review Agent account</p>
        </div>

        {/* Card */}
        <div className="card shadow-[0_20px_60px_rgb(0,0,0,0.06)] border-surface-700">
          {error && (
            <div className="flex items-center gap-3 p-4 mb-6 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium animate-fade-in shadow-sm">
              <AlertCircle size={18} className="shrink-0 text-red-500" />
              {error}
            </div>
          )}

          <form id="form-login" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="label text-text-main font-semibold">Email</label>
              <div className="relative mt-1.5">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light" />
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  className="input pl-12 h-12 text-base"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="label text-text-main font-semibold">Password</label>
              <div className="relative mt-1.5">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light" />
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="input pl-12 pr-12 h-12 text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-light hover:text-text-main transition-colors bg-white rounded-full p-1 shadow-sm border border-surface-700"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button id="btn-login-submit" type="submit" className="btn-primary w-full justify-center mt-4 h-12 text-base" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-text-muted text-sm mt-8 font-medium">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-500 hover:text-brand-600 font-bold transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

