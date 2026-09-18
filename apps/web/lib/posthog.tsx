'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react';
import { useEffect, ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from './auth-context';

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST;

if (typeof window !== 'undefined' && KEY) {
  posthog.init(KEY, {
    api_host: HOST,
    capture_pageview: false,       // we'll do it manually
    capture_pageleave: true,
    loaded: (ph) => {
      if (process.env.NODE_ENV === 'development') {
        ph.debug();
      }
    },
  });
}

export function PostHogProvider({ children }: { children: ReactNode }) {
  return <PHProvider client={posthog}>{children}</PHProvider>;
}

export function PostHogPageTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ph = usePostHog();
  const { user } = useAuth();

  // Capture pageviews
  useEffect(() => {
    if (!ph) return;
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    ph.capture('$pageview', { $current_url: url });
  }, [pathname, searchParams, ph]);

  // Identify user when logged in
  useEffect(() => {
    if (!ph) return;
    if (user) {
      ph.identify(user.id, {
        email: user.email,
        role: user.role,
        name: user.full_name,
      });
    } else {
      ph.reset();
    }
  }, [user, ph]);

  return null;
}