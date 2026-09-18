import { MarketingPage } from '@/components/layout/marketing-page';

export const metadata = { title: 'About — WorkLabs' };

export default function AboutPage() {
  return (
    <MarketingPage title="About WorkLabs">
      <p>
        WorkLabs is a freelance marketplace connecting skilled professionals
        with clients who need their expertise — across design, development,
        writing, and more.
      </p>
      <p>
        We built WorkLabs to make hiring simple: post a job, review proposals,
        and pay securely through our escrow system. Freelancers get paid on
        time, clients get quality work.
      </p>
      <h2>How it works</h2>
      <ol>
        <li>Clients post a job with a description, budget, and timeline.</li>
        <li>Freelancers submit proposals with cover letters and bids.</li>
        <li>The client accepts one proposal, forming a contract.</li>
        <li>Work is split into milestones — approved one at a time.</li>
        <li>Payments flow through escrow, released as work is delivered.</li>
      </ol>
      <h2>Our promise</h2>
      <p>
        No hidden fees. No surprise charges. Clear terms, secure payments,
        and a support team that actually responds.
      </p>
    </MarketingPage>
  );
}