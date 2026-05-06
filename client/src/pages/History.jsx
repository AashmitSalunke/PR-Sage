import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { historyAPI, reviewAPI } from '../api/index.js';
import ReviewCard from '../components/ReviewCard.jsx';
import CommentList from '../components/CommentList.jsx';
import { History as HistoryIcon, ChevronLeft, ChevronRight, X, Github, AlertCircle } from 'lucide-react';

export default function History() {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [postingId, setPostingId] = useState(null);
  const [postError, setPostError] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['history', page],
    queryFn: () => historyAPI.getHistory(page, 10).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => historyAPI.deleteReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['history'] });
      if (selected?._id === deleteMutation.variables) setSelected(null);
    },
  });

  const handlePostToGitHub = async (reviewId) => {
    setPostingId(reviewId);
    setPostError('');
    try {
      await reviewAPI.postComments(reviewId);
      queryClient.invalidateQueries({ queryKey: ['history'] });
    } catch (err) {
      setPostError(err.response?.data?.message || 'Failed to post comments');
    } finally {
      setPostingId(null);
    }
  };

  const pagination = data?.pagination;

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8 animate-fade-in">
        <h1 className="section-title flex items-center gap-2">
          <HistoryIcon size={22} className="text-brand-400" />
          Review History
        </h1>
        <p className="section-subtitle">All your past PR reviews</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* List */}
        <div className="lg:col-span-2 space-y-3">
          {isLoading && (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card h-24 animate-pulse bg-surface-700/50" />
              ))}
            </div>
          )}

          {error && (
            <div className="card border-red-500/20 bg-red-500/5 text-red-400 text-sm flex items-center gap-2">
              <AlertCircle size={15} />
              Failed to load history
            </div>
          )}

          {!isLoading && data?.reviews?.length === 0 && (
            <div className="card text-center py-12">
              <HistoryIcon size={32} className="text-white/10 mx-auto mb-3" />
              <p className="text-white/30 text-sm">No reviews yet.</p>
              <p className="text-white/20 text-xs mt-1">Submit a PR from the Dashboard.</p>
            </div>
          )}

          {data?.reviews?.map((review) => (
            <ReviewCard
              key={review._id}
              review={review}
              onClick={() => setSelected(review)}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <button
                id="btn-prev-page"
                onClick={() => setPage((p) => p - 1)}
                disabled={!pagination.hasPrevPage}
                className="btn-secondary py-2 px-3 text-xs disabled:opacity-30"
              >
                <ChevronLeft size={14} />
                Prev
              </button>
              <span className="text-white/30 text-xs">
                Page {pagination.page} / {pagination.totalPages}
              </span>
              <button
                id="btn-next-page"
                onClick={() => setPage((p) => p + 1)}
                disabled={!pagination.hasNextPage}
                className="btn-secondary py-2 px-3 text-xs disabled:opacity-30"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-3">
          {selected ? (
            <div className="card sticky top-24 animate-slide-up">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-bold text-white">{selected.prTitle || `PR #${selected.prNumber}`}</h2>
                  <p className="text-white/40 text-xs mt-0.5">
                    {selected.owner}/{selected.repo} · {selected.model}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    id="btn-post-comments"
                    onClick={() => handlePostToGitHub(selected._id)}
                    disabled={postingId === selected._id}
                    className="btn-secondary py-2 text-xs gap-1.5"
                  >
                    <Github size={13} />
                    {postingId === selected._id ? 'Posting...' : 'Post to GitHub'}
                  </button>
                  <button
                    id="btn-close-detail"
                    onClick={() => setSelected(null)}
                    className="p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {postError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle size={13} />
                  {postError}
                </div>
              )}

              <div className="max-h-[60vh] overflow-y-auto">
                <CommentList comments={selected.comments || []} />
              </div>
            </div>
          ) : (
            <div className="card flex flex-col items-center justify-center py-20 text-center">
              <HistoryIcon size={40} className="text-white/10 mb-4" />
              <p className="text-white/30 text-sm">Select a review to see details</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
