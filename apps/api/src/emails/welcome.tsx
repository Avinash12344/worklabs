import {
  Html,
  Body,
  Container,
  Heading,
  Text,
  Button,
  Hr,
} from '@react-email/components';

type WelcomeEmailProps = {
  fullName: string;
  role: 'client' | 'freelancer' | 'admin';
};

export function WelcomeEmail({ fullName, role }: WelcomeEmailProps) {
  const appUrl = process.env.APP_URL ?? 'http://localhost:3000';

  return (
    <Html>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Heading style={headingStyle}>Welcome to WorkLabs, {fullName}!</Heading>

          <Text style={textStyle}>
            You're now part of a growing community connecting clients with
            talented freelancers.
          </Text>

          {role === 'freelancer' ? (
            <Text style={textStyle}>
              <strong>Next step:</strong> set up payments so you can start
              receiving money from clients as soon as you land your first gig.
            </Text>
          ) : (
            <Text style={textStyle}>
              <strong>Next step:</strong> post your first job and get proposals
              from skilled freelancers within hours.
            </Text>
          )}

          <Button
            href={
              role === 'freelancer'
                ? `${appUrl}/settings/payments`
                : `${appUrl}/jobs/new`
            }
            style={buttonStyle}
          >
            {role === 'freelancer' ? 'Set up payments' : 'Post a job'}
          </Button>

          <Hr style={hrStyle} />

          <Text style={footerStyle}>
            You're receiving this email because you signed up for WorkLabs.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Inline styles — email clients don't support external CSS or Tailwind.
const bodyStyle = {
  backgroundColor: '#f8fafc',
  fontFamily: 'system-ui, sans-serif',
  padding: '20px',
};
const containerStyle = {
  backgroundColor: '#ffffff',
  padding: '40px',
  borderRadius: '8px',
  maxWidth: '560px',
  margin: '0 auto',
};
const headingStyle = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#0f172a',
  margin: '0 0 20px',
};
const textStyle = {
  fontSize: '16px',
  lineHeight: '1.5',
  color: '#334155',
  margin: '0 0 20px',
};
const buttonStyle = {
  backgroundColor: '#0f172a',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '6px',
  textDecoration: 'none',
  display: 'inline-block',
  fontWeight: '600',
  marginTop: '8px',
};
const hrStyle = {
  borderColor: '#e2e8f0',
  margin: '30px 0',
};
const footerStyle = {
  fontSize: '12px',
  color: '#64748b',
  margin: '0',
};