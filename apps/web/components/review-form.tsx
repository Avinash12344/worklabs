'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { StarRating } from './star-rating';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  reviewer_id: string;
  reviewee_id: string;
};

export function ReviewSection({ contractId }: { contractId: string }) {
  const { user, token } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!token) return;
    try {
      const res = await fetch(
        `${API_URL}/api/contracts/${contractId}/reviews`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractId, token]);

  const myReview = reviews.find((r) => r.reviewer_id === user?.id);
  const theirReview = reviews.find((r) => r.reviewer_id !== user?.id);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          contract_id: contractId,
          rating,
          comment: comment || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to submit review');
      }
      setComment('');
      setRating(5);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  if (!user || loading) return null;

  return (
    <div className="mt-6 bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <h2 className="text-xl font-semibold text-slate-900 mb-4">Reviews</h2>

      {myReview ? (
        <div className="p-4 bg-slate-50 rounded-md">
          <div className="text-sm font-medium text-slate-700 mb-2">
            Your review
          </div>
          <StarRating value={myReview.rating} />
          {myReview.comment && (
            <p className="mt-2 text-slate-700 whitespace-pre-wrap">
              {myReview.comment}
            </p>
          )}
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Your rating
            </label>
            <StarRating value={rating} onChange={setRating} size="lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Comment (optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
              placeholder="How was the experience?"
            />
          </div>
          {error && (
            <div className="p-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit review'}
          </button>
        </form>
      )}

      {theirReview && (
        <div className="mt-6 pt-6 border-t border-slate-200">
          <div className="text-sm font-medium text-slate-700 mb-2">
            Their review of you
          </div>
          <StarRating value={theirReview.rating} />
          {theirReview.comment && (
            <p className="mt-2 text-slate-700 whitespace-pre-wrap">
              {theirReview.comment}
            </p>
          )}
        </div>
      )}
    </div>
  );
}