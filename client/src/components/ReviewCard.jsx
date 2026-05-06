import { formatDistanceToNow } from '../utils/date.js';
import { GitPullRequest, CheckCircle, AlertCircle, Loader, Clock, MessageSquare, Trash2 } from 'lucide-react';

const statusConfig = {
  done: { label: 'Done', icon: CheckCircle, className: 'badge-success' },
  streaming: { label: 'Reviewing...', icon: Loader, className: 'badge-info' },
  pending: { label: 'Pending', icon: Clock, className: 'badge-pending' },
  error: { label: 'Error', icon: AlertCircle, className: 'badge-error' },
};

export default function ReviewCard({ review, onClick, onDelete }) {
  const status = statusConfig[review.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <article
      id={`review-card-${review._id}`}
      className="card-hover group animate-fade-in"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 w-9 h-9 rounded-lg bg-brand-600/15 border border-brand-500/20 flex items-center justify-center shrink-0">
            <GitPullRequest size={16} className="text-brand-400" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-white text-sm truncate group-hover:text-brand-300 transition-colors">
              {review.prTitle || `PR #${review.prNumber}`}
            </h3>
            <p className="text-white/40 text-xs mt-0.5 truncate">
              {review.owner}/{review.repo} · PR #{review.prNumber}
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 shrink-0">
          <span className={status.className}>
            <StatusIcon size={10} className={review.status === 'streaming' ? 'animate-spin' : ''} />
            {status.label}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
        <div className="flex items-center gap-4 text-xs text-white/30">
          <span className="flex items-center gap-1">
            <MessageSquare size={11} />
            {review.comments?.length || 0} comments
          </span>
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {formatDistanceToNow(review.createdAt)}
          </span>
          <span className="font-mono text-white/20">{review.model}</span>
        </div>
        {onDelete && (
          <button
            id={`btn-delete-review-${review._id}`}
            onClick={(e) => { e.stopPropagation(); onDelete(review._id); }}
            className="btn-danger opacity-0 group-hover:opacity-100 py-1 px-2 text-xs"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </article>
  );
}
