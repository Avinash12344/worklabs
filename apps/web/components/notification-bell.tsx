'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useNotifications, Notification } from '@/lib/notifications-context';

export function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-full hover:bg-slate-100"
        aria-label="Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <span className="font-semibold text-slate-900 text-sm">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-slate-500 hover:text-slate-900"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">
                No notifications yet
              </p>
            ) : (
              notifications.map((n) => (
                <NotificationRow
                  key={n.id}
                  notification={n}
                  onClick={() => {
                    markRead(n.id);
                    setOpen(false);
                  }}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationRow({
  notification,
  onClick,
}: {
  notification: Notification;
  onClick: () => void;
}) {
  const { href, text } = describe(notification);
  const isUnread = !notification.read_at;

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`block px-4 py-3 border-b border-slate-100 hover:bg-slate-50 ${
        isUnread ? 'bg-blue-50/40' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        {isUnread && (
          <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
        )}
        <div className={isUnread ? '' : 'pl-4'}>
          <div className="text-sm text-slate-900">{text}</div>
          <div className="text-xs text-slate-500 mt-0.5">
            {timeAgo(notification.created_at)}
          </div>
        </div>
      </div>
    </Link>
  );
}

function describe(n: Notification): { href: string; text: string } {
  const p = n.payload;
  switch (n.type) {
    case 'proposal_received':
      return {
        href: `/jobs/${p.job_id}`,
        text: `${p.freelancer_name} submitted a proposal on "${p.job_title}"`,
      };
    case 'message_received':
      return {
        href: `/contracts/${p.contract_id}`,
        text: `${p.sender_name}: ${p.preview}`,
      };
    case 'milestone_submitted':
      return {
        href: `/contracts/${p.contract_id}`,
        text: `Milestone "${p.milestone_title}" submitted for review`,
      };
    case 'milestone_approved':
      return {
        href: `/contracts/${p.contract_id}`,
        text: `Milestone "${p.milestone_title}" approved — ₹${(
          (p.amount as number) / 100
        ).toLocaleString()}`,
      };
    case 'payment_released':
      return {
        href: `/contracts/${p.contract_id}`,
        text: `Payment released: ₹${((p.amount as number) / 100).toLocaleString()}`,
      };
    default:
      return { href: '/', text: 'New notification' };
  }
}

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}