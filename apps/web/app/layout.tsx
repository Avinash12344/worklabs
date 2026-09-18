import { NotificationsProvider } from '@/lib/notifications-context';
import { AuthProvider } from '@/lib/auth-context';
import './globals.css';
import { PostHogProvider, PostHogPageTracker } from '@/lib/posthog';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <NotificationsProvider>
            <PostHogProvider>
              <PostHogPageTracker />
              {children}
            </PostHogProvider>
          </NotificationsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}