'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import { useAuth } from './auth-context';
import { supabase } from './supabase-browser';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type Notification = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};

type NotificationsContextValue = {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  refresh: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | undefined>(
  undefined
);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const tokenRef = useRef<string | null>(null);

  // Keep tokenRef in sync
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  const refresh = useCallback(async () => {
    if (!tokenRef.current) return;
    try {
      const res = await fetch(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${tokenRef.current}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on login, clear on logout
  useEffect(() => {
    if (!user || !token) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    refresh();
  }, [user, token, refresh]);

  // Realtime subscription — one channel, no per-notification dependency
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications((prev) => {
            if (prev.some((n) => n.id === newNotif.id)) return prev;
            return [newNotif, ...prev];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const markRead = useCallback(async (id: string) => {
    if (!tokenRef.current) return;
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, read_at: new Date().toISOString() } : n
      )
    );
    await fetch(`${API_URL}/api/notifications/${id}/read`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenRef.current}` },
    });
  }, []);

  const markAllRead = useCallback(async () => {
    if (!tokenRef.current) return;
    const now = new Date().toISOString();
    setNotifications((prev) =>
      prev.map((n) => (n.read_at ? n : { ...n, read_at: now }))
    );
    await fetch(`${API_URL}/api/notifications/read-all`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenRef.current}` },
    });
  }, []);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <NotificationsContext.Provider
      value={{ notifications, unreadCount, loading, markRead, markAllRead, refresh }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationsProvider');
  return ctx;
}