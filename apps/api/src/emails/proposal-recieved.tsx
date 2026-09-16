import { Html, Body, Container, Heading, Text, Button } from '@react-email/components';

type Props = {
  clientName: string;
  jobTitle: string;
  freelancerName: string;
  bidAmount: number; // paise
  jobId: string;
};

export function ProposalReceivedEmail({ clientName, jobTitle, freelancerName, bidAmount, jobId }: Props) {
  const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
  return (
    <Html>
      <Body style={{ backgroundColor: '#f8fafc', fontFamily: 'system-ui, sans-serif', padding: '20px' }}>
        <Container style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '8px', maxWidth: '560px', margin: '0 auto' }}>
          <Heading style={{ fontSize: '22px', color: '#0f172a' }}>New proposal on "{jobTitle}"</Heading>
          <Text style={{ fontSize: '16px', color: '#334155' }}>
            Hi {clientName}, <strong>{freelancerName}</strong> has submitted a proposal for
            your job at <strong>₹{(bidAmount / 100).toLocaleString()}</strong>.
          </Text>
          <Button
            href={`${appUrl}/jobs/${jobId}`}
            style={{ backgroundColor: '#0f172a', color: '#ffffff', padding: '12px 24px', borderRadius: '6px', textDecoration: 'none', display: 'inline-block', fontWeight: '600' }}
          >
            Review proposal
          </Button>
        </Container>
      </Body>
    </Html>
  );
}