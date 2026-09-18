import { MarketingPage } from '@/components/layout/marketing-page';

export const metadata = { title: 'Terms of Service — WorkLabs' };

export default function TermsPage() {
  return (
    <MarketingPage title="Terms of Service">
      <p className="text-bodySm text-slate-500">
        Last updated: {new Date().toLocaleDateString()}
      </p>

      <h2>1. Acceptance</h2>
      <p>
        By accessing WorkLabs, you agree to these terms. If you don&apos;t
        agree, please don&apos;t use the service.
      </p>

      <h2>2. Accounts</h2>
      <p>
        You&apos;re responsible for your account security. Notify us
        immediately of any unauthorized use.
      </p>

      <h2>3. Payments</h2>
      <p>
        All payments flow through Stripe. Funds are held in escrow until
        milestones are approved. We charge no platform fee during beta.
      </p>

      <h2>4. Conduct</h2>
      <p>
        Don&apos;t harass, defraud, or misrepresent. Accounts that violate
        these terms may be suspended.
      </p>

      <h2>5. Disputes</h2>
      <p>
        If a contract is disputed, WorkLabs will mediate based on the
        evidence provided by both parties.
      </p>

      <h2>6. Liability</h2>
      <p>
        WorkLabs is provided as-is. We don&apos;t guarantee specific
        outcomes from any engagement.
      </p>

      <h2>7. Changes</h2>
      <p>
        We may update these terms. Continued use constitutes acceptance of
        changes.
      </p>

      <p className="mt-8 text-caption text-slate-500">
        This is a placeholder. Real terms should be reviewed by counsel
        before production use.
      </p>
    </MarketingPage>
  );
}