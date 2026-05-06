import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import CommentList from '../components/CommentList.jsx';
import { GitPullRequest, Send, Zap, AlertCircle, CheckCircle, ChevronDown } from 'lucide-react';

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
    info: 'text-white/50',
    progress: 'text-brand-400',
    success: 'text-emerald-400',
    done: 'text-emerald-300 font-semibold',
    error: 'text-red-400',
    warning: 'text-amber-400',
  };

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="section-title flex items-center gap-2">
          <Zap size={22} className="text-brand-400" />
          Review Dashboard
        </h1>
        <p className="section-subtitle">Paste a GitHub PR URL to start an AI-powered code review</p>
      </div>

      {/* PR URL Form */}
      <form id="form-start-review" onSubmit={handleStartReview} className="card mb-6 animate-slide-up">
        <label htmlFor="input-pr-url" className="label text-base font-semibold text-white/80 mb-3">
          GitHub Pull Request URL
        </label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <GitPullRequest size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              id="input-pr-url"
              type="url"
              value={prUrl}
              onChange={(e) => setPrUrl(e.target.value)}
              placeholder="https://github.com/owner/repo/pull/123"
              required
              disabled={reviewing}
              className="input pl-10"
            />
          </div>
          <button
            id="btn-start-review"
            type="submit"
            disabled={reviewing || !prUrl.trim()}
            className="btn-primary shrink-0"
          >
            {reviewing ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Reviewing...
              </>
            ) : (
              <>
                <Send size={15} />
                Start Review
              </>
            )}
          </button>
        </div>
      </form>

      {/* PR Info Banner */}
      {prInfo && (
        <div className="glass p-4 mb-6 animate-fade-in">
          <p className="font-semibold text-white text-sm">{prInfo.title}</p>
          {prInfo.description && (
            <p className="text-white/40 text-xs mt-1 line-clamp-2">{prInfo.description}</p>
          )}
          <div className="flex gap-4 mt-2 text-xs">
            <span className="text-emerald-400">+{prInfo.additions} additions</span>
            <span className="text-red-400">-{prInfo.deletions} deletions</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Log */}
        <div className="card flex flex-col gap-0">
          <h2 className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${reviewing ? 'bg-brand-400 animate-pulse' : status === 'done' ? 'bg-emerald-400' : status === 'error' ? 'bg-red-400' : 'bg-white/20'}`} />
            Live Log
          </h2>
          <div className="flex-1 min-h-[200px] max-h-64 overflow-y-auto font-mono text-xs space-y-1 bg-surface-900/60 rounded-xl p-3">
            {events.length === 0 && (
              <p className="text-white/20">Waiting for review to start...</p>
            )}
            {events.map((ev, i) => (
              <div key={i} className={`flex gap-2 ${eventColors[ev.type] || 'text-white/50'}`}>
                <span className="text-white/20 shrink-0">{ev.time}</span>
                <span>{ev.message}</span>
              </div>
            ))}
            {streamText && (
              <div className="text-white/30 border-l-2 border-brand-500/30 pl-2 mt-1 whitespace-pre-wrap break-all">
                {streamText}
                <span className="inline-block w-1.5 h-3.5 bg-brand-400 ml-0.5 animate-pulse" />
              </div>
            )}
            <div ref={logEndRef} />
          </div>

          {/* Status badge */}
          {status && (
            <div className={`mt-3 flex items-center gap-2 text-xs ${status === 'done' ? 'text-emerald-400' : status === 'error' ? 'text-red-400' : 'text-brand-400'}`}>
              {status === 'done' && <CheckCircle size={13} />}
              {status === 'error' && <AlertCircle size={13} />}
              {status === 'streaming' && <span className="w-3 h-3 border border-brand-400 border-t-transparent rounded-full animate-spin" />}
              <span className="capitalize">{status}</span>
            </div>
          )}
        </div>

        {/* Comments panel */}
        <div className="card">
          <h2 className="font-semibold text-white text-sm mb-4 flex items-center gap-2">
            Review Comments
            {comments.length > 0 && (
              <span className="badge badge-info">{comments.length}</span>
            )}
          </h2>
          <div className="max-h-80 overflow-y-auto">
            <CommentList comments={comments} />
          </div>

          {reviewId && status === 'done' && comments.length > 0 && (
            <button
              id="btn-post-to-github"
              onClick={() => navigate(`/history`)}
              className="btn-secondary w-full justify-center mt-4"
            >
              View in History
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="card mt-6 border-red-500/20 bg-red-500/5 animate-fade-in">
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle size={15} />
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}
    </main>
  );
}
