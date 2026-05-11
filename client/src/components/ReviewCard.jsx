import { formatDistanceToNow } from '../utils/date.js';
import { GitPullRequest, CheckCircle, AlertCircle, Loader, Clock, MessageSquare, Trash2 } from 'lucide-react';

const statusConfig = {
  done: { label: 'Done', icon: CheckCircle, className: 'badge-success shadow-sm' },
  streaming: { label: 'Reviewing...', icon: Loader, className: 'badge-info shadow-sm' },
  pending: { label: 'Pending', icon: Clock, className: 'badge-pending shadow-sm' },
  error: { label: 'Error', icon: AlertCircle, className: 'badge-error shadow-sm' },
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
        <div className="flex items-start gap-4 min-w-0">
          <div className="mt-1 w-10 h-10 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105 group-hover:rotate-3">
            <GitPullRequest size={18} className="text-brand-500" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-text-main text-base truncate group-hover:text-brand-600 transition-colors">
              {review.prTitle || `PR #${review.prNumber}`}
            </h3>
            <p className="text-text-muted font-medium text-sm mt-0.5 truncate">
              {review.owner}/{review.repo} · PR #{review.prNumber}
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 shrink-0">
          <span className={status.className}>
            <StatusIcon size={12} className={review.status === 'streaming' ? 'animate-spin' : ''} />
            {status.label}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-5 pt-4 border-t border-surface-700/50">
        <div className="flex items-center gap-5 text-sm font-medium text-text-light">
          <span className="flex items-center gap-1.5">
            <MessageSquare size={14} className="text-brand-400" />
            {review.comments?.length || 0} comments
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={14} className="text-surface-500" />
            {formatDistanceToNow(review.createdAt)}
          </span>
          <span className="font-mono text-xs bg-surface-800 px-2 py-0.5 rounded-md border border-surface-700 shadow-sm text-text-muted">{review.model}</span>
        </div>
        {onDelete && (
          <button
            id={`btn-delete-review-${review._id}`}
            onClick={(e) => { e.stopPropagation(); onDelete(review._id); }}
            className="btn-danger opacity-0 group-hover:opacity-100 py-1.5 px-3 text-xs shadow-sm focus:opacity-100"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </article>
  );
}

