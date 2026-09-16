import { Html, Body, Container, Heading, Text, Button } from '@react-email/components';

type Props = {
  freelancerName: string;
  milestoneTitle: string;
  amount: number; // paise
  contractId: string;
};

export function MilestoneApprovedEmail({ freelancerName, milestoneTitle, amount, contractId }: Props) {
  const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
  return (
    <Html>
      <Body style={{ backgroundColor: '#f8fafc', fontFamily: 'system-ui, sans-serif', padding: '20px' }}>
        <Container style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '8px', maxWidth: '560px', margin: '0 auto' }}>
          <Heading style={{ fontSize: '22px', color: '#0f172a' }}>
            🎉 Milestone approved: {milestoneTitle}
          </Heading>
          <Text style={{ fontSize: '16px', color: '#334155' }}>
            Hi {freelancerName}, your work has been approved and
            <strong> ₹{(amount / 100).toLocaleString()}</strong> is on its way to your bank.
          </Text>
          <Button
            href={`${appUrl}/contracts/${contractId}`}
            style={{ backgroundColor: '#0f172a', color: '#ffffff', padding: '12px 24px', borderRadius: '6px', textDecoration: 'none', display: 'inline-block', fontWeight: '600' }}
          >
            View contract
          </Button>
        </Container>
      </Body>
    </Html>
  );
}