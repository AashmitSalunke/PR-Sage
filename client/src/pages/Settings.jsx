import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsAPI } from '../api/index.js';
import {
  Settings as SettingsIcon, Github, Sparkles, ToggleLeft, ToggleRight,
  Save, CheckCircle, AlertCircle, Eye, EyeOff, RefreshCw, ExternalLink,
} from 'lucide-react';

const GEMINI_MODELS = [
  { id: 'gemini-3-flash-preview',          label: 'Gemini 3 Flash Preview',       desc: '⭐ Default — latest & fastest preview' },
  { id: 'gemini-2.5-flash-preview-04-17',  label: 'Gemini 2.5 Flash Preview',     desc: 'Strong reasoning, very fast' },
  { id: 'gemini-2.5-pro-preview-03-25',    label: 'Gemini 2.5 Pro Preview',       desc: 'Highest quality, higher quota cost' },
  { id: 'gemini-2.0-flash',               label: 'Gemini 2.0 Flash',             desc: 'Stable, fast' },
  { id: 'gemini-1.5-flash',               label: 'Gemini 1.5 Flash',             desc: 'Reliable, free tier friendly' },
  { id: 'gemini-1.5-pro',                 label: 'Gemini 1.5 Pro',               desc: 'Best quality in 1.5 series' },
];

export default function Settings() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    githubToken: '',
    geminiModel: 'gemini-3-flash-preview',
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
        geminiModel: data.geminiModel || 'gemini-1.5-flash',
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
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8 animate-fade-in">
        <h1 className="section-title flex items-center gap-2">
          <SettingsIcon size={22} className="text-brand-400" />
          Settings
        </h1>
        <p className="section-subtitle">Configure your GitHub token and Gemini AI model</p>
      </div>

      {isLoading ? (
        <div className="card animate-pulse h-64 bg-surface-700/50" />
      ) : (
        <form id="form-settings" onSubmit={handleSubmit} className="space-y-6 animate-slide-up">

          {/* Gemini AI Configuration */}
          <div className="card">
            <h2 className="font-semibold text-white flex items-center gap-2 mb-1">
              <Sparkles size={16} className="text-brand-400" />
              Gemini AI Model
            </h2>
            <p className="text-white/30 text-xs mb-4">
              Powered by Google Gemini API. Get your key at{' '}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-400 hover:text-brand-300 inline-flex items-center gap-0.5"
              >
                aistudio.google.com <ExternalLink size={10} />
              </a>
              . The API key is set in your server's <code className="bg-white/5 px-1 py-0.5 rounded">.env</code> file.
            </p>

            <div className="space-y-3">
              {GEMINI_MODELS.map((m) => (
                <label
                  key={m.id}
                  htmlFor={`model-${m.id}`}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    form.geminiModel === m.id
                      ? 'border-brand-500/50 bg-brand-500/10'
                      : 'border-white/5 hover:border-white/10 hover:bg-white/5'
                  }`}
                >
                  <input
                    type="radio"
                    id={`model-${m.id}`}
                    name="geminiModel"
                    value={m.id}
                    checked={form.geminiModel === m.id}
                    onChange={(e) => setForm((f) => ({ ...f, geminiModel: e.target.value }))}
                    className="accent-brand-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-white">{m.label}</p>
                    <p className="text-xs text-white/40">{m.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* GitHub Token */}
          <div className="card">
            <h2 className="font-semibold text-white flex items-center gap-2 mb-4">
              <Github size={16} className="text-white/60" />
              GitHub Token
              {data?.hasGithubToken && (
                <span className="badge badge-success ml-1">Saved ✓</span>
              )}
            </h2>

            <div>
              <label htmlFor="settings-github-token" className="label">
                Personal Access Token
              </label>
              <div className="relative">
                <input
                  id="settings-github-token"
                  type={showToken ? 'text' : 'password'}
                  value={form.githubToken}
                  onChange={(e) => setForm((f) => ({ ...f, githubToken: e.target.value }))}
                  placeholder={data?.hasGithubToken ? '••••••••  (leave blank to keep existing)' : 'ghp_xxxxxxxxxxxxxxxxxxxx'}
                  className="input pr-10 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowToken((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <p className="text-white/30 text-xs mt-1.5">
                Create at{' '}
                <a
                  href="https://github.com/settings/tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-400 hover:text-brand-300 inline-flex items-center gap-0.5"
                >
                  github.com/settings/tokens <ExternalLink size={10} />
                </a>
                {' '}— needs <code className="bg-white/5 px-1 py-0.5 rounded">repo</code> scope.
              </p>
            </div>
          </div>

          {/* Review Preferences */}
          <div className="card">
            <h2 className="font-semibold text-white mb-4">Review Preferences</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">Auto-post comments to GitHub</p>
                <p className="text-xs text-white/30 mt-0.5">
                  Automatically post Gemini review comments after every review
                </p>
              </div>
              <button
                type="button"
                id="toggle-auto-post"
                onClick={() => setForm((f) => ({ ...f, autoPostComments: !f.autoPostComments }))}
              >
                {form.autoPostComments ? (
                  <ToggleRight size={32} className="text-brand-400" />
                ) : (
                  <ToggleLeft size={32} className="text-white/20" />
                )}
              </button>
            </div>
          </div>

          {/* Save */}
          <div className="flex items-center gap-3">
            <button id="btn-save-settings" type="submit" disabled={mutation.isPending} className="btn-primary">
              {mutation.isPending ? (
                <><RefreshCw size={15} className="animate-spin" /> Saving...</>
              ) : (
                <><Save size={15} /> Save Settings</>
              )}
            </button>

            {saveSuccess && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-400 animate-fade-in">
                <CheckCircle size={15} /> Saved!
              </span>
            )}
            {mutation.isError && (
              <span className="flex items-center gap-1.5 text-sm text-red-400 animate-fade-in">
                <AlertCircle size={15} />
                {mutation.error?.response?.data?.message || 'Save failed'}
              </span>
            )}
          </div>
        </form>
      )}
    </main>
  );
}
