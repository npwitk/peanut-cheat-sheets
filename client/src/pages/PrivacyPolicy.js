import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
  min-height: calc(100vh - 60px);
  background: ${props => props.theme.colors.background};
`;

const Header = styled.div`
  margin-bottom: 2rem;
  text-align: center;
`;

const Title = styled.h1`
  font-size: ${props => props.theme.typography.sizes['3xl']};
  margin-bottom: 0.5rem;
  color: ${props => props.theme.colors.text};
  font-weight: ${props => props.theme.typography.weights.bold};
`;

const LastUpdated = styled.p`
  font-size: ${props => props.theme.typography.sizes.sm};
  color: ${props => props.theme.colors.textSecondary};
  font-style: italic;
`;

const Content = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.radius.lg};
  padding: 2.5rem;
  box-shadow: ${props => props.theme.shadows.md};
  border: 1px solid ${props => props.theme.colors.border};
`;

const Section = styled.section`
  margin-bottom: 2.5rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h2`
  font-size: ${props => props.theme.typography.sizes['2xl']};
  margin-bottom: 1rem;
  color: ${props => props.theme.colors.text};
  font-weight: ${props => props.theme.typography.weights.semibold};
`;

const SubsectionTitle = styled.h3`
  font-size: ${props => props.theme.typography.sizes.lg};
  margin-bottom: 0.75rem;
  margin-top: 1.5rem;
  color: ${props => props.theme.colors.text};
  font-weight: ${props => props.theme.typography.weights.semibold};
`;

const Paragraph = styled.p`
  font-size: ${props => props.theme.typography.sizes.base};
  color: ${props => props.theme.colors.textSecondary};
  line-height: 1.7;
  margin-bottom: 1rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const List = styled.ul`
  list-style-type: disc;
  padding-left: 2rem;
  margin-bottom: 1rem;
`;

const ListItem = styled.li`
  font-size: ${props => props.theme.typography.sizes.base};
  color: ${props => props.theme.colors.textSecondary};
  line-height: 1.7;
  margin-bottom: 0.5rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const Strong = styled.strong`
  color: ${props => props.theme.colors.text};
  font-weight: ${props => props.theme.typography.weights.semibold};
`;

const ContactLink = styled.a`
  color: ${props => props.theme.colors.primary};
  text-decoration: none;
  font-weight: ${props => props.theme.typography.weights.semibold};

  &:hover {
    text-decoration: underline;
  }
`;

const PrivacyPolicy = () => {
  return (
    <Container>
      <Header>
        <Title>Privacy Policy</Title>
        <LastUpdated>Last Updated: October 16, 2025</LastUpdated>
      </Header>

      <Content>
        <Section>
          <Paragraph>
            Welcome to the Peanut Cheat Sheet Marketplace ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
          </Paragraph>
          <Paragraph>
            By accessing or using our service, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our service.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>1. Information We Collect</SectionTitle>

          <SubsectionTitle>1.1 Personal Information</SubsectionTitle>
          <Paragraph>
            We collect personal information that you provide directly to us when you:
          </Paragraph>
          <List>
            <ListItem>Register for an account using Google OAuth authentication</ListItem>
            <ListItem>Make purchases on our platform</ListItem>
            <ListItem>Upload cheat sheets as a seller</ListItem>
            <ListItem>Contact our support team</ListItem>
            <ListItem>Participate in surveys or promotions</ListItem>
          </List>
          <Paragraph>
            This information may include:
          </Paragraph>
          <List>
            <ListItem><Strong>Email address</Strong> (restricted to @g.siit.tu.ac.th domain)</ListItem>
            <ListItem><Strong>Name</Strong> as provided by your Google account</ListItem>
            <ListItem><Strong>Profile picture</Strong> from your Google account</ListItem>
            <ListItem><Strong>Student identification information</Strong></ListItem>
            <ListItem><Strong>Payment information</Strong> (processed securely through our payment provider)</ListItem>
          </List>

          <SubsectionTitle>1.2 Analytics and Usage Data</SubsectionTitle>
          <Paragraph>
            We automatically collect certain information about your device and how you interact with our platform. This includes:
          </Paragraph>
          <List>
            <ListItem><Strong>Session data:</Strong> Information about your login sessions, session duration, and authentication status</ListItem>
            <ListItem><Strong>Click data:</Strong> Records of buttons clicked, links followed, and features accessed to understand user behavior and improve our platform</ListItem>
            <ListItem><Strong>Search data:</Strong> Search queries, search results, and filters used to help us improve search functionality and content recommendations</ListItem>
            <ListItem><Strong>Browser information:</Strong> Browser type, version, and settings</ListItem>
            <ListItem><Strong>Device information:</Strong> Device type, operating system, and unique device identifiers</ListItem>
            <ListItem><Strong>IP address:</Strong> Your internet protocol address for security and analytics purposes</ListItem>
            <ListItem><Strong>Usage patterns:</Strong> Pages visited, time spent on pages, navigation paths, and feature usage</ListItem>
            <ListItem><Strong>Download history:</Strong> Records of cheat sheets downloaded and timestamps</ListItem>
          </List>

          <SubsectionTitle>1.3 Transaction Information</SubsectionTitle>
          <List>
            <ListItem>Purchase history and transaction records</ListItem>
            <ListItem>Payment method information (PromptPay)</ListItem>
            <ListItem>Billing information</ListItem>
            <ListItem>Order details and receipts</ListItem>
          </List>

          <SubsectionTitle>1.4 Content You Provide</SubsectionTitle>
          <List>
            <ListItem>Cheat sheets uploaded by sellers (including PDF files and metadata)</ListItem>
            <ListItem>Reviews and ratings of cheat sheets</ListItem>
            <ListItem>Support tickets and communications</ListItem>
            <ListItem>Feedback and survey responses</ListItem>
          </List>
        </Section>

        <Section>
          <SectionTitle>2. How We Use Your Information</SectionTitle>
          <Paragraph>
            We use the information we collect for the following purposes:
          </Paragraph>

          <SubsectionTitle>2.1 Service Delivery</SubsectionTitle>
          <List>
            <ListItem>To create and manage your account</ListItem>
            <ListItem>To authenticate your identity through Google OAuth</ListItem>
            <ListItem>To process transactions and deliver purchased cheat sheets</ListItem>
            <ListItem>To apply personalized watermarks to PDF files</ListItem>
            <ListItem>To provide customer support and respond to inquiries</ListItem>
          </List>

          <SubsectionTitle>2.2 Platform Improvement and Analytics</SubsectionTitle>
          <List>
            <ListItem><Strong>Session analytics:</Strong> To monitor active users, detect unauthorized access, and improve authentication security</ListItem>
            <ListItem><Strong>Click analytics:</Strong> To understand which features are most used, identify usability issues, and optimize user interface design</ListItem>
            <ListItem><Strong>Search analytics:</Strong> To improve search algorithms, identify popular content, and provide better content recommendations</ListItem>
            <ListItem>To analyze usage patterns and optimize platform performance</ListItem>
            <ListItem>To identify and fix technical issues and bugs</ListItem>
            <ListItem>To conduct research and development for new features</ListItem>
          </List>

          <SubsectionTitle>2.3 Communication</SubsectionTitle>
          <List>
            <ListItem>To send transactional emails (purchase confirmations, download links)</ListItem>
            <ListItem>To notify you about important platform updates</ListItem>
            <ListItem>To respond to support requests and inquiries</ListItem>
            <ListItem>To send administrative information about your account</ListItem>
          </List>

          <SubsectionTitle>2.4 Security and Legal Compliance</SubsectionTitle>
          <List>
            <ListItem>To detect and prevent fraud, abuse, and unauthorized access</ListItem>
            <ListItem>To enforce our Terms of Service and protect intellectual property</ListItem>
            <ListItem>To comply with legal obligations and respond to legal requests</ListItem>
            <ListItem>To maintain the security and integrity of our platform</ListItem>
          </List>
        </Section>

        <Section>
          <SectionTitle>3. Data Storage and Security</SectionTitle>
          <Paragraph>
            We implement appropriate technical and organizational security measures to protect your personal information:
          </Paragraph>
          <List>
            <ListItem><Strong>Encryption:</Strong> Data is encrypted in transit using SSL/TLS protocols and at rest in our databases</ListItem>
            <ListItem><Strong>Access controls:</Strong> Strict access controls limit who can view or process your data</ListItem>
            <ListItem><Strong>Session management:</Strong> Secure session storage using MySQL with automatic expiration</ListItem>
            <ListItem><Strong>Authentication:</Strong> JWT-based authentication with 7-day token expiry</ListItem>
            <ListItem><Strong>Watermarking:</Strong> PDF files are watermarked with user information to prevent unauthorized sharing</ListItem>
            <ListItem><Strong>Rate limiting:</Strong> Protection against automated attacks and abuse</ListItem>
            <ListItem><Strong>Regular security audits:</Strong> Periodic review of security practices and vulnerabilities</ListItem>
          </List>
          <Paragraph>
            However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your personal information, we cannot guarantee absolute security.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>4. Data Sharing and Disclosure</SectionTitle>
          <Paragraph>
            We do not sell your personal information. We may share your information in the following circumstances:
          </Paragraph>

          <SubsectionTitle>4.1 With Service Providers</SubsectionTitle>
          <List>
            <ListItem><Strong>Google:</Strong> For OAuth authentication services</ListItem>
            <ListItem><Strong>Payment processors:</Strong> For processing PromptPay transactions (Omise/Stripe)</ListItem>
            <ListItem><Strong>Hosting providers:</Strong> For cloud infrastructure and database services</ListItem>
            <ListItem><Strong>Analytics services:</Strong> For aggregated usage analytics (data is anonymized where possible)</ListItem>
          </List>

          <SubsectionTitle>4.2 With Content Creators</SubsectionTitle>
          <Paragraph>
            When you purchase a cheat sheet, the seller may see:
          </Paragraph>
          <List>
            <ListItem>Your name (for watermarking and transaction records)</ListItem>
            <ListItem>Purchase date and transaction information</ListItem>
            <ListItem>Number of downloads (for analytics purposes)</ListItem>
          </List>

          <SubsectionTitle>4.3 For Legal Reasons</SubsectionTitle>
          <Paragraph>
            We may disclose your information if required by law or if we believe such action is necessary to:
          </Paragraph>
          <List>
            <ListItem>Comply with legal obligations or respond to lawful requests</ListItem>
            <ListItem>Protect our rights, property, or safety</ListItem>
            <ListItem>Investigate potential violations of our Terms of Service</ListItem>
            <ListItem>Prevent fraud or security threats</ListItem>
          </List>
        </Section>

        <Section>
          <SectionTitle>5. Your Rights and Choices</SectionTitle>
          <Paragraph>
            You have the following rights regarding your personal information:
          </Paragraph>

          <SubsectionTitle>5.1 Access and Correction</SubsectionTitle>
          <List>
            <ListItem>View your account information and purchase history</ListItem>
            <ListItem>Update your profile information through your account settings</ListItem>
            <ListItem>Request a copy of the personal data we hold about you</ListItem>
          </List>

          <SubsectionTitle>5.2 Account Deactivation</SubsectionTitle>
          <List>
            <ListItem>You may deactivate your account at any time through the Support page</ListItem>
            <ListItem>Deactivation prevents future logins but preserves purchase history and transaction records</ListItem>
            <ListItem>Contact support to reactivate a deactivated account</ListItem>
          </List>

          <SubsectionTitle>5.3 Data Deletion</SubsectionTitle>
          <Paragraph>
            You may request deletion of your personal data by contacting support. Please note:
          </Paragraph>
          <List>
            <ListItem>Transaction records may be retained for legal and accounting purposes</ListItem>
            <ListItem>Content you uploaded as a seller may remain available if already purchased by others</ListItem>
            <ListItem>Analytics data may be retained in anonymized form</ListItem>
          </List>

          <SubsectionTitle>5.4 Opt-Out Options</SubsectionTitle>
          <List>
            <ListItem>You may opt out of non-essential communications</ListItem>
            <ListItem>You cannot opt out of transactional or administrative emails</ListItem>
          </List>
        </Section>

        <Section>
          <SectionTitle>6. Cookies and Tracking Technologies</SectionTitle>
          <Paragraph>
            We use cookies and similar tracking technologies to:
          </Paragraph>
          <List>
            <ListItem>Maintain your login session</ListItem>
            <ListItem>Remember your preferences and settings</ListItem>
            <ListItem>Analyze site traffic and usage patterns</ListItem>
            <ListItem>Track click events and search behavior for analytics</ListItem>
            <ListItem>Improve platform performance and user experience</ListItem>
          </List>
          <Paragraph>
            You can control cookies through your browser settings, but disabling cookies may affect platform functionality.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>7. Data Retention</SectionTitle>
          <Paragraph>
            We retain your personal information for as long as necessary to provide our services and comply with legal obligations:
          </Paragraph>
          <List>
            <ListItem><Strong>Account data:</Strong> Retained while your account is active or as needed to provide services</ListItem>
            <ListItem><Strong>Transaction records:</Strong> Retained for 7 years for accounting and legal purposes</ListItem>
            <ListItem><Strong>Analytics data:</Strong> Session, click, and search data retained for up to 2 years for analysis purposes</ListItem>
            <ListItem><Strong>Support tickets:</Strong> Retained for 3 years for service improvement</ListItem>
            <ListItem><Strong>Deactivated accounts:</Strong> Personal data may be deleted after 1 year of deactivation</ListItem>
          </List>
        </Section>

        <Section>
          <SectionTitle>8. Third-Party Links</SectionTitle>
          <Paragraph>
            Our platform may contain links to third-party websites or services. We are not responsible for the privacy practices of these external sites. We encourage you to review the privacy policies of any third-party services you access.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>9. Children's Privacy</SectionTitle>
          <Paragraph>
            Our service is intended for SIIT students only. We do not knowingly collect personal information from individuals under the age of 13. If you believe we have collected information from a child under 13, please contact us immediately.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>10. International Data Transfers</SectionTitle>
          <Paragraph>
            Your information may be transferred to and processed in countries other than Thailand. We ensure appropriate safeguards are in place to protect your personal information in accordance with this Privacy Policy.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>11. Changes to This Privacy Policy</SectionTitle>
          <Paragraph>
            We may update this Privacy Policy from time to time. We will notify you of any material changes by:
          </Paragraph>
          <List>
            <ListItem>Posting the new Privacy Policy on this page</ListItem>
            <ListItem>Updating the "Last Updated" date</ListItem>
            <ListItem>Sending you an email notification (for significant changes)</ListItem>
          </List>
          <Paragraph>
            Your continued use of the platform after any changes indicates your acceptance of the updated Privacy Policy.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>12. Contact Us</SectionTitle>
          <Paragraph>
            If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us through:
          </Paragraph>
          <List>
            <ListItem><Strong>Support Page:</Strong> Submit a support ticket through your account</ListItem>
            <ListItem><Strong>Email:</Strong> <ContactLink href="mailto:hey@npwitk.com">hey@npwitk.com</ContactLink></ListItem>
          </List>
          <Paragraph>
            We will respond to your inquiry within 30 days.
          </Paragraph>
        </Section>
      </Content>
    </Container>
  );
};

export default PrivacyPolicy;
