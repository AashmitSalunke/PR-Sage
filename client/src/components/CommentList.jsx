import { AlertTriangle, AlertCircle, Lightbulb, ThumbsUp, FileCode } from 'lucide-react';

const severityConfig = {
  critical: {
    icon: AlertCircle,
    className: 'border-red-200 bg-red-50/80 shadow-sm',
    iconClass: 'text-red-500',
    labelClass: 'text-red-600',
    label: 'Critical',
  },
  warning: {
    icon: AlertTriangle,
    className: 'border-amber-200 bg-amber-50/80 shadow-sm',
    iconClass: 'text-amber-500',
    labelClass: 'text-amber-600',
    label: 'Warning',
  },
  suggestion: {
    icon: Lightbulb,
    className: 'border-brand-200 bg-brand-50/80 shadow-sm',
    iconClass: 'text-brand-500',
    labelClass: 'text-brand-600',
    label: 'Suggestion',
  },
  praise: {
    icon: ThumbsUp,
    className: 'border-emerald-200 bg-emerald-50/80 shadow-sm',
    iconClass: 'text-emerald-500',
    labelClass: 'text-emerald-600',
    label: 'Praise',
  },
};

function CommentItem({ comment, index }) {
  const config = severityConfig[comment.severity] || severityConfig.suggestion;
  const Icon = config.icon;

  return (
    <div
      id={`comment-${index}`}
      className={`rounded-2xl border p-4 animate-fade-in ${config.className}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0 bg-white p-1.5 rounded-lg shadow-sm border border-surface-700/30">
          <Icon size={16} className={config.iconClass} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={`text-xs font-bold uppercase tracking-wide ${config.labelClass}`}>
              {config.label}
            </span>
            {comment.path && (
              <span className="flex items-center gap-1.5 text-xs text-text-muted font-mono bg-white px-2 py-1 rounded-md border border-surface-700 shadow-sm truncate max-w-xs">
                <FileCode size={12} className="text-text-light" />
                {comment.path}
                {comment.line && <span className="text-text-light font-semibold">:{comment.line}</span>}
              </span>
            )}
          </div>
          <p className="text-sm text-text-main leading-relaxed whitespace-pre-wrap">{comment.body}</p>
        </div>
      </div>
    </div>
  );
}

export default function CommentList({ comments = [] }) {
  if (comments.length === 0) {
    return (
      <div className="text-center py-12 text-text-muted">
        <p className="text-sm">No comments yet.</p>
      </div>
    );
  }

  // Group by severity for display order: critical → warning → suggestion → praise
  const order = ['critical', 'warning', 'suggestion', 'praise'];
  const sorted = [...comments].sort(
    (a, b) => order.indexOf(a.severity) - order.indexOf(b.severity)
  );

  const counts = comments.reduce((acc, c) => {
    acc[c.severity] = (acc[c.severity] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Summary chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.entries(counts).map(([severity, count]) => {
          const cfg = severityConfig[severity];
          if (!cfg) return null;
          const SIcon = cfg.icon;
          return (
            <span key={severity} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border bg-white shadow-sm ${cfg.labelClass} ${cfg.className.split(' ')[0]}`}>
              <SIcon size={13} />
              {count} {cfg.label}
            </span>
          );
        })}
      </div>

      {sorted.map((comment, i) => (
        <CommentItem key={i} comment={comment} index={i} />
      ))}
    </div>
  );
}

