import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

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

const OrderedList = styled.ol`
  list-style-type: decimal;
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

const InternalLink = styled(Link)`
  color: ${props => props.theme.colors.primary};
  text-decoration: none;
  font-weight: ${props => props.theme.typography.weights.semibold};

  &:hover {
    text-decoration: underline;
  }
`;

const ContactLink = styled.a`
  color: ${props => props.theme.colors.primary};
  text-decoration: none;
  font-weight: ${props => props.theme.typography.weights.semibold};

  &:hover {
    text-decoration: underline;
  }
`;

const HighlightBox = styled.div`
  background: ${props => props.theme.colors.primaryLight || '#e3f2fd'};
  border-left: 4px solid ${props => props.theme.colors.primary};
  padding: 1rem 1.5rem;
  margin: 1rem 0;
  border-radius: ${props => props.theme.radius.md};
`;

const TermsOfService = () => {
  return (
    <Container>
      <Header>
        <Title>Terms of Service</Title>
        <LastUpdated>Last Updated: October 16, 2025</LastUpdated>
      </Header>

      <Content>
        <Section>
          <Paragraph>
            Welcome to Peanut Cheat Sheet Marketplace. These Terms of Service ("Terms") govern your access to and use of our platform, services, and content. By accessing or using our service, you agree to be bound by these Terms.
          </Paragraph>
          <HighlightBox>
            <Paragraph>
              <Strong>Important:</Strong> Please read these Terms carefully. By creating an account or using our platform, you acknowledge that you have read, understood, and agree to be bound by these Terms and our <InternalLink to="/privacy">Privacy Policy</InternalLink>.
            </Paragraph>
          </HighlightBox>
        </Section>

        <Section>
          <SectionTitle>1. Acceptance of Terms</SectionTitle>
          <Paragraph>
            By accessing or using the Peanut Cheat Sheet Marketplace platform, you confirm that:
          </Paragraph>
          <List>
            <ListItem>You are a student or staff member of Sirindhorn International Institute of Technology (SIIT), Thammasat University</ListItem>
            <ListItem>You have a valid @g.siit.tu.ac.th email address</ListItem>
            <ListItem>You are at least 13 years of age</ListItem>
            <ListItem>You have the legal capacity to enter into a binding agreement</ListItem>
            <ListItem>You agree to comply with all applicable laws and regulations</ListItem>
          </List>
          <Paragraph>
            If you do not agree to these Terms, you must not access or use our services.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>2. Account Registration and Security</SectionTitle>

          <SubsectionTitle>2.1 Account Creation</SubsectionTitle>
          <List>
            <ListItem>You must register using your @g.siit.tu.ac.th Google account via OAuth authentication</ListItem>
            <ListItem>Only one account per user is permitted</ListItem>
            <ListItem>You must provide accurate and complete information</ListItem>
            <ListItem>You are responsible for maintaining the confidentiality of your account credentials</ListItem>
          </List>

          <SubsectionTitle>2.2 Account Security</SubsectionTitle>
          <List>
            <ListItem>You are solely responsible for all activities that occur under your account</ListItem>
            <ListItem>You must immediately notify us of any unauthorized access or security breach</ListItem>
            <ListItem>We are not liable for any loss or damage arising from unauthorized use of your account</ListItem>
            <ListItem>You must not share your account credentials with others</ListItem>
          </List>

          <SubsectionTitle>2.3 Account Suspension and Termination</SubsectionTitle>
          <Paragraph>
            We reserve the right to suspend or terminate your account at any time if:
          </Paragraph>
          <List>
            <ListItem>You violate these Terms of Service</ListItem>
            <ListItem>You engage in fraudulent or illegal activities</ListItem>
            <ListItem>You abuse or misuse the platform</ListItem>
            <ListItem>You upload prohibited or infringing content</ListItem>
            <ListItem>Your account is inactive for an extended period</ListItem>
          </List>
        </Section>

        <Section>
          <SectionTitle>3. User Roles and Permissions</SectionTitle>

          <SubsectionTitle>3.1 Buyers</SubsectionTitle>
          <Paragraph>
            As a buyer, you may:
          </Paragraph>
          <List>
            <ListItem>Browse and search for cheat sheets</ListItem>
            <ListItem>Purchase cheat sheets using PromptPay payment</ListItem>
            <ListItem>Download purchased cheat sheets for personal use</ListItem>
            <ListItem>Review and rate cheat sheets you have purchased</ListItem>
            <ListItem>Submit support tickets and feedback</ListItem>
          </List>

          <SubsectionTitle>3.2 Sellers</SubsectionTitle>
          <Paragraph>
            To become a seller, you must:
          </Paragraph>
          <List>
            <ListItem>Apply through the "Apply to be Seller" feature</ListItem>
            <ListItem>Receive approval from platform administrators</ListItem>
            <ListItem>Agree to additional seller terms and conditions</ListItem>
          </List>
          <Paragraph>
            Approved sellers may:
          </Paragraph>
          <List>
            <ListItem>Upload and sell cheat sheets on the platform</ListItem>
            <ListItem>Set prices for their content within platform guidelines</ListItem>
            <ListItem>Receive payments for sold content</ListItem>
            <ListItem>View sales analytics and purchase data</ListItem>
          </List>

          <SubsectionTitle>3.3 Staff and Administrators</SubsectionTitle>
          <Paragraph>
            Platform staff have additional privileges to maintain platform quality and security, including content moderation and user management.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>4. Content Guidelines and Intellectual Property</SectionTitle>

          <SubsectionTitle>4.1 Content Ownership</SubsectionTitle>
          <List>
            <ListItem>Sellers retain ownership of the content they upload</ListItem>
            <ListItem>By uploading content, sellers grant us a non-exclusive license to distribute and display the content on our platform</ListItem>
            <ListItem>Buyers receive a personal, non-transferable license to use purchased content for educational purposes only</ListItem>
          </List>

          <SubsectionTitle>4.2 Prohibited Content</SubsectionTitle>
          <Paragraph>
            You may not upload, share, or distribute content that:
          </Paragraph>
          <List>
            <ListItem>Violates copyright, trademark, or other intellectual property rights</ListItem>
            <ListItem>Contains exam questions or answers from official university examinations</ListItem>
            <ListItem>Promotes academic dishonesty or cheating</ListItem>
            <ListItem>Contains malicious code, viruses, or harmful software</ListItem>
            <ListItem>Includes offensive, defamatory, or inappropriate material</ListItem>
            <ListItem>Violates any applicable laws or regulations</ListItem>
            <ListItem>Contains personal information of others without consent</ListItem>
          </List>

          <SubsectionTitle>4.3 Content Standards</SubsectionTitle>
          <List>
            <ListItem>All cheat sheets must be original work or properly licensed</ListItem>
            <ListItem>Content must be relevant to SIIT courses and educational purposes</ListItem>
            <ListItem>Files must be in PDF format and meet quality standards</ListItem>
            <ListItem>Titles and descriptions must be accurate and not misleading</ListItem>
          </List>

          <SubsectionTitle>4.4 Watermarking and Protection</SubsectionTitle>
          <List>
            <ListItem>All downloaded PDFs are watermarked with buyer information</ListItem>
            <ListItem>Watermarking helps prevent unauthorized distribution</ListItem>
            <ListItem>Removing or attempting to remove watermarks is strictly prohibited</ListItem>
            <ListItem>Sharing watermarked files may result in account termination</ListItem>
          </List>
        </Section>

        <Section>
          <SectionTitle>5. Purchases and Payments</SectionTitle>

          <SubsectionTitle>5.1 Pricing and Payment</SubsectionTitle>
          <List>
            <ListItem>All prices are displayed in Thai Baht (THB)</ListItem>
            <ListItem>Payment is processed through PromptPay</ListItem>
            <ListItem>You must complete payment before accessing purchased content</ListItem>
            <ListItem>Prices are subject to change without notice</ListItem>
          </List>

          <SubsectionTitle>5.2 Purchase Process</SubsectionTitle>
          <OrderedList>
            <ListItem>Add cheat sheets to your cart</ListItem>
            <ListItem>Proceed to checkout and receive a PromptPay QR code</ListItem>
            <ListItem>Complete payment through your banking app</ListItem>
            <ListItem>Purchase is confirmed by admin</ListItem>
            <ListItem>Download links become available after payment confirmation</ListItem>
          </OrderedList>

          <SubsectionTitle>5.3 Refund Policy</SubsectionTitle>
          <HighlightBox>
            <Paragraph>
              <Strong>No Refunds:</Strong> All sales are final. Due to the digital nature of our products and immediate access upon purchase, we do not offer refunds, exchanges, or cancellations once a purchase is completed.
            </Paragraph>
          </HighlightBox>
          <Paragraph>
            Exceptions may be made in the following cases:
          </Paragraph>
          <List>
            <ListItem>Technical issues prevent you from downloading purchased content</ListItem>
            <ListItem>Content is significantly different from its description</ListItem>
            <ListItem>Duplicate charges due to payment processing errors</ListItem>
            <ListItem>Content violates our policies and has been removed</ListItem>
          </List>
          <Paragraph>
            To request a refund under these circumstances, contact support within 7 days of purchase with proof of the issue.
          </Paragraph>

          <SubsectionTitle>5.4 Transaction Records</SubsectionTitle>
          <List>
            <ListItem>All transactions are recorded and maintained for accounting purposes</ListItem>
            <ListItem>You can view your purchase history in your account</ListItem>
            <ListItem>Transaction records are kept for a minimum of 7 years</ListItem>
          </List>
        </Section>

        <Section>
          <SectionTitle>6. Usage Rights and Restrictions</SectionTitle>

          <SubsectionTitle>6.1 Permitted Use</SubsectionTitle>
          <Paragraph>
            Purchased cheat sheets may be used for:
          </Paragraph>
          <List>
            <ListItem>Personal educational purposes</ListItem>
            <ListItem>Study and exam preparation</ListItem>
            <ListItem>Reference during coursework</ListItem>
            <ListItem>Printing for personal use</ListItem>
          </List>

          <SubsectionTitle>6.2 Prohibited Use</SubsectionTitle>
          <Paragraph>
            You may NOT:
          </Paragraph>
          <List>
            <ListItem>Share, distribute, or resell purchased cheat sheets</ListItem>
            <ListItem>Remove or modify watermarks from PDF files</ListItem>
            <ListItem>Upload purchased content to file-sharing sites or public platforms</ListItem>
            <ListItem>Use automated tools to scrape or download content</ListItem>
            <ListItem>Create derivative works for commercial purposes</ListItem>
            <ListItem>Reverse engineer or attempt to extract protected content</ListItem>
            <ListItem>Use content for purposes other than personal education</ListItem>
          </List>

          <SubsectionTitle>6.3 Download Limits</SubsectionTitle>
          <List>
            <ListItem>Each purchase allows unlimited downloads of the same cheat sheet</ListItem>
            <ListItem>All downloads are logged with IP address and user agent for security</ListItem>
            <ListItem>Suspicious download patterns may trigger account review</ListItem>
          </List>
        </Section>

        <Section>
          <SectionTitle>7. Analytics and Data Collection</SectionTitle>
          <Paragraph>
            As detailed in our <InternalLink to="/privacy">Privacy Policy</InternalLink>, we collect and analyze:
          </Paragraph>
          <List>
            <ListItem><Strong>Session data:</Strong> Login sessions, authentication, and activity tracking</ListItem>
            <ListItem><Strong>Click data:</Strong> User interactions, button clicks, and navigation patterns</ListItem>
            <ListItem><Strong>Search data:</Strong> Search queries, filters, and result interactions</ListItem>
            <ListItem><Strong>Usage analytics:</Strong> Feature usage, page views, and time spent on platform</ListItem>
          </List>
          <Paragraph>
            This data helps us improve the platform, enhance user experience, and provide better content recommendations. By using our platform, you consent to this data collection.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>8. Seller Terms and Conditions</SectionTitle>

          <SubsectionTitle>8.1 Seller Approval Process</SubsectionTitle>
          <List>
            <ListItem>All seller applications are reviewed by platform administrators</ListItem>
            <ListItem>Approval is granted at our sole discretion</ListItem>
            <ListItem>We may reject applications without providing reasons</ListItem>
            <ListItem>Seller status may be revoked at any time for violations</ListItem>
          </List>

          <SubsectionTitle>8.2 Content Approval</SubsectionTitle>
          <List>
            <ListItem>All uploaded cheat sheets must be approved before being listed</ListItem>
            <ListItem>We review content for quality, accuracy, and policy compliance</ListItem>
            <ListItem>Content may be rejected or removed without notice</ListItem>
            <ListItem>Repeated rejections may result in loss of seller privileges</ListItem>
          </List>

          <SubsectionTitle>8.3 Revenue and Payments</SubsectionTitle>
          <List>
            <ListItem>Platform commission rates will be communicated to approved sellers</ListItem>
            <ListItem>Sellers are responsible for any applicable taxes on their earnings</ListItem>
            <ListItem>Payment terms and schedules are subject to platform policies</ListItem>
            <ListItem>We reserve the right to withhold payments for policy violations</ListItem>
          </List>

          <SubsectionTitle>8.4 Seller Responsibilities</SubsectionTitle>
          <List>
            <ListItem>Ensure all uploaded content is original or properly licensed</ListItem>
            <ListItem>Respond to buyer inquiries and support requests</ListItem>
            <ListItem>Maintain high-quality content standards</ListItem>
            <ListItem>Comply with all platform policies and guidelines</ListItem>
            <ListItem>Report any copyright infringement or policy violations</ListItem>
          </List>
        </Section>

        <Section>
          <SectionTitle>9. Platform Availability and Modifications</SectionTitle>

          <SubsectionTitle>9.1 Service Availability</SubsectionTitle>
          <List>
            <ListItem>We strive to maintain 24/7 platform availability</ListItem>
            <ListItem>Scheduled maintenance may cause temporary downtime</ListItem>
            <ListItem>We do not guarantee uninterrupted access to the service</ListItem>
            <ListItem>We are not liable for losses due to service interruptions</ListItem>
          </List>

          <SubsectionTitle>9.2 Changes to Service</SubsectionTitle>
          <Paragraph>
            We reserve the right to:
          </Paragraph>
          <List>
            <ListItem>Modify, suspend, or discontinue any feature or service</ListItem>
            <ListItem>Update pricing structures and commission rates</ListItem>
            <ListItem>Change platform policies and guidelines</ListItem>
            <ListItem>Introduce new features or remove existing ones</ListItem>
          </List>
          <Paragraph>
            Material changes will be communicated through email or platform notifications.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>10. Limitation of Liability</SectionTitle>
          <HighlightBox>
            <Paragraph>
              <Strong>Disclaimer:</Strong> The platform and content are provided "AS IS" without warranties of any kind, either express or implied. We do not guarantee the accuracy, completeness, or quality of any content on the platform.
            </Paragraph>
          </HighlightBox>
          <Paragraph>
            To the maximum extent permitted by law:
          </Paragraph>
          <List>
            <ListItem>We are not liable for any indirect, incidental, consequential, or punitive damages</ListItem>
            <ListItem>Our total liability shall not exceed the amount you paid to us in the past 12 months</ListItem>
            <ListItem>We are not responsible for content uploaded by sellers or other users</ListItem>
            <ListItem>We are not liable for academic consequences of using purchased content</ListItem>
            <ListItem>We do not guarantee that content will help you achieve specific academic outcomes</ListItem>
          </List>
        </Section>

        <Section>
          <SectionTitle>11. Indemnification</SectionTitle>
          <Paragraph>
            You agree to indemnify and hold harmless Peanut Cheat Sheet Marketplace, its operators, staff, and affiliates from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:
          </Paragraph>
          <List>
            <ListItem>Your violation of these Terms of Service</ListItem>
            <ListItem>Your violation of any rights of third parties</ListItem>
            <ListItem>Your use or misuse of the platform</ListItem>
            <ListItem>Content you upload or share on the platform</ListItem>
            <ListItem>Your breach of any applicable laws or regulations</ListItem>
          </List>
        </Section>

        <Section>
          <SectionTitle>12. Academic Integrity</SectionTitle>
          <HighlightBox>
            <Paragraph>
              <Strong>Important Notice:</Strong> This platform provides supplementary study materials. Users are responsible for ensuring their use of purchased content complies with SIIT and Thammasat University academic integrity policies.
            </Paragraph>
          </HighlightBox>
          <Paragraph>
            We strongly emphasize that:
          </Paragraph>
          <List>
            <ListItem>Cheat sheets are meant as study aids, not substitutes for learning</ListItem>
            <ListItem>Using purchased content to cheat or plagiarize violates academic integrity</ListItem>
            <ListItem>You are responsible for understanding and following your course policies</ListItem>
            <ListItem>We are not responsible for academic consequences of content misuse</ListItem>
            <ListItem>Instructors may prohibit the use of cheat sheets in their courses</ListItem>
          </List>
        </Section>

        <Section>
          <SectionTitle>13. Copyright Infringement and DMCA</SectionTitle>

          <SubsectionTitle>13.1 Copyright Policy</SubsectionTitle>
          <Paragraph>
            We respect intellectual property rights and expect users to do the same. If you believe content on our platform infringes your copyright, please contact us with:
          </Paragraph>
          <List>
            <ListItem>Identification of the copyrighted work claimed to be infringed</ListItem>
            <ListItem>Identification of the infringing material and its location on our platform</ListItem>
            <ListItem>Your contact information (name, email, phone number)</ListItem>
            <ListItem>A statement of good faith belief that use is not authorized</ListItem>
            <ListItem>A statement that the information is accurate and you are authorized to act</ListItem>
            <ListItem>Your physical or electronic signature</ListItem>
          </List>

          <SubsectionTitle>13.2 Counter-Notification</SubsectionTitle>
          <Paragraph>
            If your content was removed due to a copyright claim and you believe it was removed in error, you may submit a counter-notification with the required information.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>14. Dispute Resolution</SectionTitle>

          <SubsectionTitle>14.1 Informal Resolution</SubsectionTitle>
          <Paragraph>
            Before pursuing formal action, please contact us through the support system to attempt to resolve any disputes informally.
          </Paragraph>

          <SubsectionTitle>14.2 Governing Law</SubsectionTitle>
          <Paragraph>
            These Terms are governed by the laws of Thailand. Any disputes shall be resolved in the courts of Thailand.
          </Paragraph>

          <SubsectionTitle>14.3 Arbitration</SubsectionTitle>
          <Paragraph>
            For disputes that cannot be resolved informally, both parties agree to binding arbitration in accordance with Thai law before pursuing litigation.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>15. Termination</SectionTitle>

          <SubsectionTitle>15.1 Termination by You</SubsectionTitle>
          <List>
            <ListItem>You may deactivate your account at any time through the Support page</ListItem>
            <ListItem>Deactivation does not entitle you to refunds for prior purchases</ListItem>
            <ListItem>Your purchase history and transaction records will be preserved</ListItem>
          </List>

          <SubsectionTitle>15.2 Termination by Us</SubsectionTitle>
          <Paragraph>
            We may terminate or suspend your account immediately if:
          </Paragraph>
          <List>
            <ListItem>You violate these Terms of Service</ListItem>
            <ListItem>You engage in fraudulent or illegal activities</ListItem>
            <ListItem>Your actions harm the platform or other users</ListItem>
            <ListItem>You abuse platform features or circumvent security measures</ListItem>
          </List>

          <SubsectionTitle>15.3 Effect of Termination</SubsectionTitle>
          <List>
            <ListItem>You lose access to your account and any content therein</ListItem>
            <ListItem>You may lose access to previously purchased content</ListItem>
            <ListItem>Outstanding payments or obligations remain in effect</ListItem>
            <ListItem>Provisions that should survive termination will remain in effect</ListItem>
          </List>
        </Section>

        <Section>
          <SectionTitle>16. Miscellaneous</SectionTitle>

          <SubsectionTitle>16.1 Entire Agreement</SubsectionTitle>
          <Paragraph>
            These Terms, together with our Privacy Policy, constitute the entire agreement between you and Peanut Cheat Sheet Marketplace regarding the use of our services.
          </Paragraph>

          <SubsectionTitle>16.2 Severability</SubsectionTitle>
          <Paragraph>
            If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect.
          </Paragraph>

          <SubsectionTitle>16.3 Waiver</SubsectionTitle>
          <Paragraph>
            Our failure to enforce any right or provision of these Terms will not be deemed a waiver of such right or provision.
          </Paragraph>

          <SubsectionTitle>16.4 Assignment</SubsectionTitle>
          <Paragraph>
            You may not assign or transfer these Terms without our written consent. We may assign these Terms to any affiliate or successor without restriction.
          </Paragraph>

          <SubsectionTitle>16.5 Force Majeure</SubsectionTitle>
          <Paragraph>
            We are not liable for any failure or delay in performance due to circumstances beyond our reasonable control, including natural disasters, war, terrorism, riots, embargoes, acts of civil or military authorities, fire, floods, accidents, pandemics, network infrastructure failures, strikes, or shortages of transportation facilities, fuel, energy, labor or materials.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>17. Changes to Terms</SectionTitle>
          <Paragraph>
            We reserve the right to modify these Terms at any time. Changes will be effective upon:
          </Paragraph>
          <List>
            <ListItem>Posting the updated Terms on this page</ListItem>
            <ListItem>Updating the "Last Updated" date</ListItem>
            <ListItem>Notifying users via email for material changes</ListItem>
          </List>
          <Paragraph>
            Your continued use of the platform after changes constitutes acceptance of the modified Terms. If you do not agree to the changes, you must stop using the platform.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>18. Contact Information</SectionTitle>
          <Paragraph>
            If you have any questions, concerns, or feedback regarding these Terms of Service, please contact us:
          </Paragraph>
          <List>
            <ListItem><Strong>Support Page:</Strong> Submit a ticket through your account at <InternalLink to="/support">/support</InternalLink></ListItem>
            <ListItem><Strong>Email:</Strong> <ContactLink href="mailto:hey@npwitk.com">hey@npwitk.com</ContactLink></ListItem>
          </List>
          <Paragraph>
            We aim to respond to all inquiries within 30 days.
          </Paragraph>
        </Section>

        <HighlightBox>
          <Paragraph>
            <Strong>Acknowledgment:</Strong> By creating an account and using Peanut Cheat Sheet Marketplace, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our <InternalLink to="/privacy">Privacy Policy</InternalLink>.
          </Paragraph>
        </HighlightBox>
      </Content>
    </Container>
  );
};

export default TermsOfService;
