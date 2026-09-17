'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { RatingBadge, StarRating } from '@/components/star-rating';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type UserProfile = {
  id: string;
  full_name: string;
  role: string;
  avatar_url: string | null;
  created_at: string;
};

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer: { id: string; full_name: string; avatar_url: string | null };
  contract: { id: string; job: { id: string; title: string } | null } | null;
};

export default function PublicProfilePage() {
  const params = useParams<{ id: string }>();
  const userId = params.id;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [average, setAverage] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [profileRes, reviewsRes] = await Promise.all([
        fetch(`${API_URL}/api/auth/users/${userId}/public`),
        fetch(`${API_URL}/api/users/${userId}/reviews`),
      ]);

      if (profileRes.ok) {
        const p = await profileRes.json();
        setProfile(p.user);
      }
      if (reviewsRes.ok) {
        const r = await reviewsRes.json();
        setReviews(r.reviews);
        setAverage(r.average);
        setTotal(r.total);
      }
      setLoading(false);
    }
    load();
  }, [userId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-3xl mx-auto">
          <p className="text-slate-500">Loading…</p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-3xl mx-auto">
          <p className="text-slate-500">User not found.</p>
          <Link href="/jobs" className="mt-4 inline-block text-slate-900 underline">
            Back to jobs
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-xl font-semibold text-slate-700">
              {profile.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900">
                {profile.full_name}
              </h1>
              <div className="text-sm text-slate-500 capitalize mt-1">
                {profile.role}
              </div>
              <div className="mt-3">
                <RatingBadge average={average} total={total} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Reviews ({total})
          </h2>

          {reviews.length === 0 ? (
            <p className="text-sm text-slate-500">No reviews yet.</p>
          ) : (
            <ul className="space-y-4">
              {reviews.map((r) => (
                <li
                  key={r.id}
                  className="border-b border-slate-100 pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-sm font-medium text-slate-700 flex-shrink-0">
                      {r.reviewer.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/users/${r.reviewer.id}`}
                          className="font-medium text-slate-900 hover:underline"
                        >
                          {r.reviewer.full_name}
                        </Link>
                        <StarRating value={r.rating} size="sm" />
                        <span className="text-xs text-slate-500">
                          {new Date(r.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {r.contract?.job && (
                        <div className="text-xs text-slate-500 mt-0.5">
                          on &ldquo;{r.contract.job.title}&rdquo;
                        </div>
                      )}

                      {r.comment && (
                        <p className="mt-2 text-slate-700 whitespace-pre-wrap text-sm">
                          {r.comment}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}