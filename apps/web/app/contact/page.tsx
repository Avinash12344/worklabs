import { MarketingPage } from '@/components/layout/marketing-page';

export const metadata = { title: 'Contact — WorkLabs' };

export default function ContactPage() {
  return (
    <MarketingPage title="Contact">
      <p>We&apos;re a small team and we read every message.</p>
      <h2>Support</h2>
      <p>
        For account issues, payment questions, or disputes: <br />
        <strong>support@worklabs.dev</strong>
      </p>
      <h2>Business</h2>
      <p>
        Partnerships, press, or anything else: <br />
        <strong>hello@worklabs.dev</strong>
      </p>
      <h2>Response time</h2>
      <p>We typically reply within 24 hours on business days.</p>
    </MarketingPage>
  );
}