import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import CommentList from '../components/CommentList.jsx';
import { GitPullRequest, Send, Zap, AlertCircle, CheckCircle, ChevronDown, Sparkles } from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export default function Dashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [prUrl, setPrUrl] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [events, setEvents] = useState([]);
  const [comments, setComments] = useState([]);
  const [prInfo, setPrInfo] = useState(null);
  const [reviewId, setReviewId] = useState(null);
  const [status, setStatus] = useState(null); // 'streaming' | 'done' | 'error'
  const [streamText, setStreamText] = useState('');
  const [error, setError] = useState('');

  const streamTextRef = useRef('');
  const eventSourceRef = useRef(null);
  const logEndRef = useRef(null);

  // Auto-scroll log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events, streamText]);

  const handleStartReview = async (e) => {
    e.preventDefault();
    if (!prUrl.trim()) return;

    // Reset state
    setEvents([]);
    setComments([]);
    setPrInfo(null);
    setReviewId(null);
    setStreamText('');
    streamTextRef.current = '';
    setError('');
    setStatus('streaming');
    setReviewing(true);

    // Close any existing SSE connection
    if (eventSourceRef.current) eventSourceRef.current.close();

    // Use fetch for SSE with auth header (EventSource doesn't support headers)
    try {
      const response = await fetch(`${BASE_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prUrl }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to start review');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const processEvent = (eventStr) => {
        const lines = eventStr.split('\n');
        let eventName = '';
        let dataStr = '';
        for (const line of lines) {
          if (line.startsWith('event:')) eventName = line.slice(6).trim();
          if (line.startsWith('data:')) dataStr = line.slice(5).trim();
        }
        if (!eventName || !dataStr) return;

        try {
          const data = JSON.parse(dataStr);
          switch (eventName) {
            case 'started':
              setReviewId(data.reviewId);
              addEvent('info', `Review started (ID: ${data.reviewId})`);
              break;
            case 'pr_info':
              setPrInfo(data);
              addEvent('info', `PR: "${data.title}" (+${data.additions} -${data.deletions})`);
              break;
            case 'chunks':
              addEvent('info', `Diff split into ${data.total} chunk(s)`);
              break;
            case 'chunk_start':
              addEvent('progress', `Reviewing chunk ${data.index + 1}/${data.total}...`);
              streamTextRef.current = '';
              setStreamText('');
              break;
            case 'token':
              streamTextRef.current += data.token;
              setStreamText(streamTextRef.current);
              break;
            case 'chunk_done':
              if (data.comments?.length) {
                setComments((prev) => [...prev, ...data.comments]);
              }
              addEvent('success', `Chunk ${data.index + 1} done — ${data.comments?.length || 0} comment(s)`);
              streamTextRef.current = '';
              setStreamText('');
              break;
            case 'posted':
              addEvent('success', data.message);
              break;
            case 'done':
              setStatus('done');
              setReviewing(false);
              addEvent('done', `Review complete — ${data.totalComments} total comments`);
              break;
            case 'error':
              setStatus('error');
              setReviewing(false);
              setError(data.message);
              addEvent('error', data.message);
              break;
            case 'warning':
              addEvent('warning', data.message);
              break;
          }
        } catch { /* ignore parse errors */ }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop();
        for (const part of parts) {
          processEvent(part);
        }
      }
    } catch (err) {
      setStatus('error');
      setReviewing(false);
      setError(err.message);
      addEvent('error', err.message);
    }
  };

  const addEvent = (type, message) => {
    setEvents((prev) => [...prev, { type, message, time: new Date().toLocaleTimeString() }]);
  };

  const eventColors = {
    info: 'text-text-light',
    progress: 'text-brand-500 font-medium',
    success: 'text-emerald-600',
    done: 'text-emerald-600 font-bold',
    error: 'text-red-500',
    warning: 'text-amber-500',
  };

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="mb-10 animate-fade-in text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center justify-center p-3 bg-brand-50 rounded-2xl mb-4 shadow-sm animate-float">
          <Sparkles size={28} className="text-brand-500" />
        </div>
        <h1 className="section-title">
          Ready to review your code?
        </h1>
        <p className="section-subtitle text-lg">Paste a GitHub PR URL below and let our intelligent agent analyze your changes instantly.</p>
      </div>

      {/* PR URL Form */}
      <form id="form-start-review" onSubmit={handleStartReview} className="card mb-8 animate-slide-up max-w-3xl mx-auto relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 bg-brand-500 h-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <label htmlFor="input-pr-url" className="label text-base font-semibold text-text-main mb-3">
          GitHub Pull Request URL
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <GitPullRequest size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light" />
            <input
              id="input-pr-url"
              type="url"
              value={prUrl}
              onChange={(e) => setPrUrl(e.target.value)}
              placeholder="https://github.com/owner/repo/pull/123"
              required
              disabled={reviewing}
              className="input pl-12 h-12 text-base"
            />
          </div>
          <button
            id="btn-start-review"
            type="submit"
            disabled={reviewing || !prUrl.trim()}
            className="btn-primary shrink-0 h-12 px-8 text-base shadow-brand-500/20"
          >
            {reviewing ? (
              <>
                <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Reviewing...
              </>
            ) : (
              <>
                <Send size={16} />
                Start Review
              </>
            )}
          </button>
        </div>
      </form>

      {/* PR Info Banner */}
      {prInfo && (
        <div className="glass p-5 mb-8 animate-fade-in flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-3xl mx-auto">
          <div>
            <p className="font-bold text-text-main text-base">{prInfo.title}</p>
            {prInfo.description && (
              <p className="text-text-muted text-sm mt-1 line-clamp-2 leading-relaxed">{prInfo.description}</p>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm font-medium bg-white px-4 py-2 rounded-xl shadow-sm border border-surface-700 whitespace-nowrap">
            <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">+{prInfo.additions} additions</span>
            <span className="text-red-500 bg-red-50 px-2 py-0.5 rounded-md">-{prInfo.deletions} deletions</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Live Log */}
        <div className="card flex flex-col gap-0 border-t-4 border-t-surface-600">
          <h2 className="font-bold text-text-main mb-4 flex items-center gap-2">
            <div className={`flex items-center justify-center w-6 h-6 rounded-md ${reviewing ? 'bg-brand-100 text-brand-600 animate-pulse' : status === 'done' ? 'bg-emerald-100 text-emerald-600' : status === 'error' ? 'bg-red-100 text-red-600' : 'bg-surface-800 text-text-muted'}`}>
               {reviewing ? <Zap size={14} /> : status === 'done' ? <CheckCircle size={14} /> : status === 'error' ? <AlertCircle size={14} /> : <Zap size={14} />}
            </div>
            Live Activity
          </h2>
          <div className="flex-1 min-h-[250px] max-h-72 overflow-y-auto font-mono text-sm space-y-2 bg-surface-800 rounded-2xl p-4 shadow-inner border border-surface-700/50">
            {events.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-text-light gap-2 opacity-60">
                 <Zap size={24} className="mb-2" />
                 <p>Awaiting PR submission...</p>
              </div>
            )}
            {events.map((ev, i) => (
              <div key={i} className={`flex gap-3 ${eventColors[ev.type] || 'text-text-muted'}`}>
                <span className="text-text-light shrink-0 text-xs mt-0.5 opacity-60">{ev.time}</span>
                <span className="leading-relaxed">{ev.message}</span>
              </div>
            ))}
            {streamText && (
              <div className="text-text-muted border-l-2 border-brand-400 pl-3 mt-2 whitespace-pre-wrap break-all bg-white/50 p-2 rounded-r-lg">
                {streamText}
                <span className="inline-block w-1.5 h-4 bg-brand-500 ml-1 translate-y-0.5 animate-pulse" />
              </div>
            )}
            <div ref={logEndRef} />
          </div>

          {/* Status badge */}
          {status && (
            <div className={`mt-4 inline-flex items-center self-start gap-2 text-sm font-semibold px-3 py-1.5 rounded-lg ${status === 'done' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : status === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-brand-50 text-brand-600 border border-brand-100'}`}>
              {status === 'done' && <CheckCircle size={14} />}
              {status === 'error' && <AlertCircle size={14} />}
              {status === 'streaming' && <span className="w-3.5 h-3.5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />}
              <span className="capitalize">{status === 'streaming' ? 'Agent is thinking...' : status}</span>
            </div>
          )}
        </div>

        {/* Comments panel */}
        <div className="card border-t-4 border-t-brand-400">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-text-main flex items-center gap-2">
              Review Insights
              {comments.length > 0 && (
                <span className="badge badge-info shadow-sm">{comments.length}</span>
              )}
            </h2>
          </div>
          <div className="max-h-[20rem] overflow-y-auto pr-2 custom-scrollbar">
            {comments.length === 0 && !reviewing && (
               <div className="text-center py-10 text-text-muted bg-surface-800 rounded-2xl border border-surface-700/50 border-dashed">
                 <p>No insights generated yet.</p>
               </div>
            )}
            <CommentList comments={comments} />
          </div>

          {reviewId && status === 'done' && comments.length > 0 && (
            <button
              id="btn-post-to-github"
              onClick={() => navigate(`/history`)}
              className="btn-secondary w-full justify-center mt-5"
            >
              View Full Report in History
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="card mt-8 border-red-200 bg-red-50 shadow-sm animate-fade-in flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
             <AlertCircle size={20} className="text-red-500" />
          </div>
          <div>
             <h3 className="text-red-700 font-bold text-sm">Something went wrong</h3>
             <p className="text-red-600 text-sm mt-0.5">{error}</p>
          </div>
        </div>
      )}
    </main>
  );
}

