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
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10 animate-fade-in text-center">
        <div className="inline-flex items-center justify-center p-3 bg-brand-50 rounded-2xl mb-4 shadow-sm animate-float">
          <HistoryIcon size={28} className="text-brand-500" />
        </div>
        <h1 className="section-title">
          Review History
        </h1>
        <p className="section-subtitle text-lg">Browse all your past PR reviews and their insights</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* List */}
        <div className="lg:col-span-2 space-y-4">
          {isLoading && (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card h-28 animate-pulse bg-surface-800/50 border-dashed" />
              ))}
            </div>
          )}

          {error && (
            <div className="card border-red-200 bg-red-50 text-red-600 text-sm flex items-center gap-3 shadow-sm font-semibold">
              <AlertCircle size={18} className="text-red-500" />
              Failed to load history
            </div>
          )}

          {!isLoading && data?.reviews?.length === 0 && (
            <div className="card text-center py-16 border-dashed border-2">
              <HistoryIcon size={48} className="text-surface-500/40 mx-auto mb-4" />
              <p className="text-text-muted font-bold text-base">No reviews yet.</p>
              <p className="text-text-light text-sm mt-1">Head to the Dashboard to submit a PR.</p>
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
            <div className="flex items-center justify-between pt-4">
              <button
                id="btn-prev-page"
                onClick={() => setPage((p) => p - 1)}
                disabled={!pagination.hasPrevPage}
                className="btn-secondary py-2.5 px-4 text-sm disabled:opacity-50"
              >
                <ChevronLeft size={16} />
                Prev
              </button>
              <span className="text-text-muted font-semibold text-sm bg-surface-800 px-3 py-1.5 rounded-lg border border-surface-700">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                id="btn-next-page"
                onClick={() => setPage((p) => p + 1)}
                disabled={!pagination.hasNextPage}
                className="btn-secondary py-2.5 px-4 text-sm disabled:opacity-50"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-3">
          {selected ? (
            <div className="card sticky top-24 animate-slide-up shadow-xl border-t-4 border-t-brand-400">
              <div className="flex items-start justify-between mb-6 pb-4 border-b border-surface-700/50">
                <div>
                  <h2 className="font-extrabold text-text-main text-xl">{selected.prTitle || `PR #${selected.prNumber}`}</h2>
                  <p className="text-text-muted font-medium text-sm mt-1">
                    {selected.owner}/{selected.repo} · <span className="text-text-light">{selected.model}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    id="btn-post-comments"
                    onClick={() => handlePostToGitHub(selected._id)}
                    disabled={postingId === selected._id}
                    className="btn-primary py-2.5 px-4 text-sm gap-2"
                  >
                    {postingId === selected._id ? (
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Github size={16} />
                    )}
                    {postingId === selected._id ? 'Posting...' : 'Post to GitHub'}
                  </button>
                  <button
                    id="btn-close-detail"
                    onClick={() => setSelected(null)}
                    className="p-2 rounded-xl text-text-muted hover:text-text-main hover:bg-surface-800 transition-colors border border-transparent hover:border-surface-700"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {postError && (
                <div className="mb-5 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-600 font-medium text-sm flex items-center gap-2 shadow-sm">
                  <AlertCircle size={16} className="text-red-500" />
                  {postError}
                </div>
              )}

              <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <CommentList comments={selected.comments || []} />
              </div>
            </div>
          ) : (
            <div className="card flex flex-col items-center justify-center py-32 text-center h-full border-dashed border-2">
              <div className="w-20 h-20 rounded-full bg-surface-800 flex items-center justify-center mb-6 border border-surface-700">
                 <HistoryIcon size={32} className="text-surface-500" />
              </div>
              <h3 className="text-text-main font-bold text-xl mb-2">Review Details</h3>
              <p className="text-text-muted text-sm max-w-xs mx-auto">Select any review from the list to see the detailed insights and post comments to GitHub.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

