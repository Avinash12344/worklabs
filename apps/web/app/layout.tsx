import { NotificationsProvider } from '@/lib/notifications-context';
import { AuthProvider } from '@/lib/auth-context';
import './globals.css';
import { PostHogProvider, PostHogPageTracker } from '@/lib/posthog';
import { Toaster } from 'react-hot-toast';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
  <AuthProvider>
    <NotificationsProvider>
      <PostHogProvider>
        <PostHogPageTracker />
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#ffffff',
              color: '#0f172a',
              border: '1px solid #e2e8f0',
              borderRadius: '0.5rem',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
            },
            success: {
              iconTheme: {
                primary: '#16a34a',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#dc2626',
                secondary: '#ffffff',
              },
            },
          }}
        />
      </PostHogProvider>
    </NotificationsProvider>
  </AuthProvider>
</body>
    </html>
  );
}