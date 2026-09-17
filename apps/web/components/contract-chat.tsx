'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase-browser';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Message = {
  id: string;
  content: string;
  created_at: string;
  read_at: string | null;
  sender_id: string;
  sender?: { id: string; full_name: string; avatar_url: string | null };
};

export function ContractChat({ contractId }: { contractId: string }) {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);
  type Party = { id: string; full_name: string; avatar_url: string | null };

const [parties, setParties] = useState<Record<string, Party>>({});
const partiesRef = useRef<Record<string, Party>>({});

useEffect(() => {
  partiesRef.current = parties;
}, [parties]);

  // Fetch history on mount
  useEffect(() => {
  if (!token) {
    setLoading(false);
    return;
  }
  async function load() {
    try {
      const url = `${API_URL}/api/contracts/${contractId}/messages`;
      console.log('[chat] fetching', url);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('[chat] status', res.status);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      } else {
        const err = await res.json().catch(() => ({}));
        console.error('[chat] fetch failed:', err);
      }
    } catch (err) {
      console.error('[chat] network error:', err);
    } finally {
      setLoading(false);   // ALWAYS clears loading
    }
  }
  load();
}, [contractId, token]);
  // Subscribe to realtime inserts
  useEffect(() => {
  if (!contractId) return;

  const channel = supabase
    .channel(`contract-${contractId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `contract_id=eq.${contractId}`,
      },
      (payload) => {
        const raw = payload.new as Message;
        const enriched: Message = {
          ...raw,
          sender: partiesRef.current[raw.sender_id], // ← read from ref, always latest
        };
        setMessages((prev) => {
          if (prev.some((m) => m.id === enriched.id)) return prev;
          return [...prev, enriched];
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [contractId]);  // ← back to one dependency


  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  // Mark messages as read when viewed
  useEffect(() => {
    if (!token || messages.length === 0) return;
    fetch(`${API_URL}/api/contracts/${contractId}/messages/read`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  }, [contractId, token, messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content || !token) return;

    setSending(true);
    try {
      const res = await fetch(
        `${API_URL}/api/contracts/${contractId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to send');
      }
      const data = await res.json();
      // Append immediately (Realtime will dedupe)
      setMessages((prev) =>
        prev.some((m) => m.id === data.message.id) ? prev : [...prev, data.message]
      );
      setDraft('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSending(false);
    }
  }

  if (!user) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col h-[500px]">
      <div className="border-b border-slate-200 px-4 py-3">
        <h3 className="font-semibold text-slate-900">Messages</h3>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <p className="text-sm text-slate-500 text-center">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-slate-500 text-center">
            No messages yet. Say hi.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === user.id;
            return (
              <div
                key={m.id}
                className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 ${
                    mine
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-900'
                  }`}
                >
                  {!mine && (
  <div className="text-xs opacity-70 mb-0.5">
    {m.sender?.full_name ?? 'Someone'}
  </div>
)}
                  <div className="text-sm whitespace-pre-wrap">{m.content}</div>
                  <div
                    className={`text-[10px] mt-1 ${
                      mine ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {new Date(m.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={send} className="border-t border-slate-200 p-3 flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-md"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="px-4 py-2 text-sm bg-slate-900 text-white rounded-md hover:bg-slate-700 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}