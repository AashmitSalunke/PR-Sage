import { AlertTriangle, AlertCircle, Lightbulb, ThumbsUp, FileCode } from 'lucide-react';

const severityConfig = {
  critical: {
    icon: AlertCircle,
    className: 'border-red-500/30 bg-red-500/5',
    iconClass: 'text-red-400',
    labelClass: 'text-red-400',
    label: 'Critical',
  },
  warning: {
    icon: AlertTriangle,
    className: 'border-amber-500/30 bg-amber-500/5',
    iconClass: 'text-amber-400',
    labelClass: 'text-amber-400',
    label: 'Warning',
  },
  suggestion: {
    icon: Lightbulb,
    className: 'border-brand-500/30 bg-brand-500/5',
    iconClass: 'text-brand-400',
    labelClass: 'text-brand-400',
    label: 'Suggestion',
  },
  praise: {
    icon: ThumbsUp,
    className: 'border-emerald-500/30 bg-emerald-500/5',
    iconClass: 'text-emerald-400',
    labelClass: 'text-emerald-400',
    label: 'Praise',
  },
};

function CommentItem({ comment, index }) {
  const config = severityConfig[comment.severity] || severityConfig.suggestion;
  const Icon = config.icon;

  return (
    <div
      id={`comment-${index}`}
      className={`rounded-xl border p-4 animate-fade-in ${config.className}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          <Icon size={15} className={config.iconClass} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={`text-xs font-semibold uppercase tracking-wider ${config.labelClass}`}>
              {config.label}
            </span>
            {comment.path && (
              <span className="flex items-center gap-1 text-xs text-white/40 font-mono bg-white/5 px-2 py-0.5 rounded-md truncate max-w-xs">
                <FileCode size={10} />
                {comment.path}
                {comment.line && <span className="text-white/30">:{comment.line}</span>}
              </span>
            )}
          </div>
          <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{comment.body}</p>
        </div>
      </div>
    </div>
  );
}

export default function CommentList({ comments = [] }) {
  if (comments.length === 0) {
    return (
      <div className="text-center py-12 text-white/30">
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
    <div className="space-y-3">
      {/* Summary chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.entries(counts).map(([severity, count]) => {
          const cfg = severityConfig[severity];
          if (!cfg) return null;
          const SIcon = cfg.icon;
          return (
            <span key={severity} className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border ${cfg.className} ${cfg.labelClass}`}>
              <SIcon size={11} />
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
