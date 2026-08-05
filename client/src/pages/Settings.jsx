import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsAPI } from '../api/index.js';
import {
  Settings as SettingsIcon, Github, Sparkles, ToggleLeft, ToggleRight,
  Save, CheckCircle, AlertCircle, Eye, EyeOff, RefreshCw, ExternalLink,
} from 'lucide-react';

const DEFAULT_GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile';

export default function Settings() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    githubToken: '',
    geminiModel: DEFAULT_GROQ_MODEL,
    autoPostComments: false,
  });
  const [showToken, setShowToken] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsAPI.getSettings().then((r) => r.data.settings),
  });

  useEffect(() => {
    if (data) {
      setForm((prev) => ({
        ...prev,
        geminiModel: data.geminiModel || 'llama-3.3-70b-versatile',
        autoPostComments: data.autoPostComments ?? false,
        githubToken: '',
      }));
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: (payload) => settingsAPI.updateSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      setForm((prev) => ({ ...prev, githubToken: '' }));
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      geminiModel: form.geminiModel,
      autoPostComments: form.autoPostComments,
    };
    if (form.githubToken.trim()) payload.githubToken = form.githubToken.trim();
    mutation.mutate(payload);
  };

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10 animate-fade-in text-center">
        <div className="inline-flex items-center justify-center p-3 bg-brand-50 rounded-2xl mb-4 shadow-sm animate-float">
          <SettingsIcon size={28} className="text-brand-500" />
        </div>
        <h1 className="section-title">
          Settings
        </h1>
        <p className="section-subtitle text-lg">Configure your GitHub token and Groq AI model</p>
      </div>

      {isLoading ? (
        <div className="card animate-pulse h-64 bg-surface-800 border-dashed" />
      ) : (
        <form id="form-settings" onSubmit={handleSubmit} className="space-y-8 animate-slide-up">

          {/* AI Model Configuration */}
          <div className="card border-t-4 border-t-brand-400">
            <h2 className="font-bold text-text-main flex items-center gap-2 mb-2 text-lg">
              <Sparkles size={20} className="text-brand-500" />
              Groq Model
            </h2>
            <p className="text-text-muted text-sm mb-5 leading-relaxed">
              Using the default Groq model configured in the server environment: <span className="font-semibold text-text-main">llama-3.3-70b-versatile</span>
            </p>

            <div className="rounded-2xl border border-surface-700 bg-surface-900/40 p-4">
              <p className="text-sm text-text-muted">Current model</p>
              <p className="mt-1 text-lg font-bold text-text-main">{form.geminiModel}</p>
            </div>
          </div>

          {/* GitHub Token */}
          <div className="card">
            <h2 className="font-bold text-text-main flex items-center gap-2 mb-5 text-lg">
              <Github size={20} className="text-text-muted" />
              GitHub Token
              {data?.hasGithubToken && (
                <span className="badge badge-success ml-2">Saved ✓</span>
              )}
            </h2>

            <div>
              <label htmlFor="settings-github-token" className="label text-text-main font-semibold">
                Personal Access Token
              </label>
              <div className="relative mt-1">
                <input
                  id="settings-github-token"
                  type={showToken ? 'text' : 'password'}
                  value={form.githubToken}
                  onChange={(e) => setForm((f) => ({ ...f, githubToken: e.target.value }))}
                  placeholder={data?.hasGithubToken ? '••••••••••••••••  (leave blank to keep existing)' : 'ghp_xxxxxxxxxxxxxxxxxxxx'}
                  className="input pr-12 font-mono text-sm h-12"
                />
                <button
                  type="button"
                  onClick={() => setShowToken((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-light hover:text-text-main transition-colors bg-white rounded-full p-1 shadow-sm border border-surface-700"
                >
                  {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-text-muted text-sm mt-2">
                Create at{' '}
                <a
                  href="https://github.com/settings/tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-500 font-semibold hover:text-brand-600 inline-flex items-center gap-1"
                >
                  github.com/settings/tokens <ExternalLink size={12} />
                </a>
                {' '}— needs <code className="bg-surface-800 border border-surface-700 px-1.5 py-0.5 rounded text-text-muted font-mono text-xs">repo</code> scope.
              </p>
            </div>
          </div>

          {/* Review Preferences */}
          <div className="card bg-gradient-to-br from-white to-surface-800">
            <h2 className="font-bold text-text-main mb-5 text-lg">Review Preferences</h2>
            <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-surface-700 shadow-sm">
              <div>
                <p className="text-base font-bold text-text-main">Auto-post comments to GitHub</p>
                <p className="text-sm text-text-muted mt-0.5">
                  Automatically post AI review comments after every review
                </p>
              </div>
              <button
                type="button"
                id="toggle-auto-post"
                onClick={() => setForm((f) => ({ ...f, autoPostComments: !f.autoPostComments }))}
                className="focus:outline-none transition-transform hover:scale-105 active:scale-95"
              >
                {form.autoPostComments ? (
                  <ToggleRight size={44} className="text-brand-500" />
                ) : (
                  <ToggleLeft size={44} className="text-surface-500" />
                )}
              </button>
            </div>
          </div>

          {/* Save */}
          <div className="flex items-center gap-4 pt-4 border-t border-surface-700/50">
            <button id="btn-save-settings" type="submit" disabled={mutation.isPending} className="btn-primary h-12 px-8 text-base">
              {mutation.isPending ? (
                <><RefreshCw size={18} className="animate-spin" /> Saving...</>
              ) : (
                <><Save size={18} /> Save Settings</>
              )}
            </button>

            {saveSuccess && (
              <span className="flex items-center gap-2 text-sm font-semibold text-emerald-600 animate-fade-in bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                <CheckCircle size={16} /> Saved Successfully!
              </span>
            )}
            {mutation.isError && (
              <span className="flex items-center gap-2 text-sm font-semibold text-red-600 animate-fade-in bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                <AlertCircle size={16} />
                {mutation.error?.response?.data?.message || 'Save failed'}
              </span>
            )}
          </div>
        </form>
      )}
    </main>
  );
}

