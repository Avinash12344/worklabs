import { MarketingPage } from '@/components/layout/marketing-page';

export const metadata = { title: 'Privacy Policy — WorkLabs' };

export default function PrivacyPage() {
  return (
    <MarketingPage title="Privacy Policy">
      <p className="text-bodySm text-slate-500">
        Last updated: {new Date().toLocaleDateString()}
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>Email, name, and profile details you provide.</li>
        <li>Usage data to improve the product (via PostHog).</li>
        <li>Payment metadata via Stripe (we never see card numbers).</li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To operate the platform and connect clients with freelancers.</li>
        <li>To send transactional and (if opted in) marketing emails.</li>
        <li>To detect abuse and comply with legal obligations.</li>
      </ul>

      <h2>Sharing</h2>
      <p>
        We don&apos;t sell your data. We share only with processors we use
        (Supabase, Stripe, Resend, PostHog, Sentry) as needed to run the
        service.
      </p>

      <h2>Your rights</h2>
      <p>
        You can request a data export or account deletion anytime by emailing
        privacy@worklabs.dev.
      </p>

      <h2>Cookies</h2>
      <p>
        We use minimal cookies — session handling and analytics. You can opt
        out of analytics in your browser.
      </p>

      <p className="mt-8 text-caption text-slate-500">
        This is a placeholder. Real policies should be reviewed by counsel
        before production use.
      </p>
    </MarketingPage>
  );
}