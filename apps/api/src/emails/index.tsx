import { render } from '@react-email/render';
import { WelcomeEmail } from './welcome.js';
import { ProposalReceivedEmail } from './proposal-received.js';
import { MilestoneApprovedEmail } from './milestone-approved.js';

type Rendered = { html: string; subject: string };

export async function renderTemplate(
  template: string,
  data: Record<string, unknown>
): Promise<Rendered> {
  switch (template) {
    case 'welcome':
      return {
        subject: 'Welcome to WorkLabs',
        html: await render(
          <WelcomeEmail
            fullName={String(data.fullName)}
            role={data.role as 'client' | 'freelancer' | 'admin'}
          />
        ),
      };
    case 'proposal_received':
      return {
        subject: `New proposal on "${data.jobTitle}"`,
        html: await render(
          <ProposalReceivedEmail
            clientName={String(data.clientName)}
            jobTitle={String(data.jobTitle)}
            freelancerName={String(data.freelancerName)}
            bidAmount={Number(data.bidAmount)}
            jobId={String(data.jobId)}
          />
        ),
      };
    case 'milestone_approved':
      return {
        subject: `Milestone approved: ${data.milestoneTitle}`,
        html: await render(
          <MilestoneApprovedEmail
            freelancerName={String(data.freelancerName)}
            milestoneTitle={String(data.milestoneTitle)}
            amount={Number(data.amount)}
            contractId={String(data.contractId)}
          />
        ),
      };
    default:
      throw new Error(`Unknown email template: ${template}`);
  }
}