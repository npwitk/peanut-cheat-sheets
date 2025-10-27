import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supportAPI } from '../services/api';

const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
  min-height: calc(100vh - 60px);
  background: ${props => props.theme.colors.background};
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: ${props => props.theme.typography.sizes['3xl']};
  margin-bottom: 0.5rem;
  color: ${props => props.theme.colors.text};
  font-weight: ${props => props.theme.typography.weights.bold};
`;

const Subtitle = styled.p`
  font-size: ${props => props.theme.typography.sizes.base};
  color: ${props => props.theme.colors.textSecondary};
`;

const Section = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.radius.lg};
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: ${props => props.theme.shadows.md};
  border: 1px solid ${props => props.theme.colors.border};
`;

const SectionTitle = styled.h2`
  font-size: ${props => props.theme.typography.sizes['2xl']};
  margin-bottom: 1rem;
  color: ${props => props.theme.colors.text};
  font-weight: ${props => props.theme.typography.weights.semibold};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: ${props => props.theme.typography.weights.semibold};
  color: ${props => props.theme.colors.text};
  font-size: ${props => props.theme.typography.sizes.sm};
`;

const Select = styled.select`
  padding: 0.875rem;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.radius.md};
  font-size: ${props => props.theme.typography.sizes.base};
  background: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.text};
  cursor: pointer;
  transition: all ${props => props.theme.transitions.fast};

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primaryLight};
  }
`;

const TextArea = styled.textarea`
  padding: 0.875rem;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.radius.md};
  font-size: ${props => props.theme.typography.sizes.base};
  font-family: inherit;
  min-height: 150px;
  resize: vertical;
  background: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.text};
  transition: all ${props => props.theme.transitions.fast};

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primaryLight};
  }
`;

const Button = styled.button`
  background: ${props => props.$danger ? props.theme.colors.error : props.theme.colors.primary};
  color: white;
  border: none;
  padding: 0.875rem 1.5rem;
  border-radius: ${props => props.theme.radius.md};
  font-weight: ${props => props.theme.typography.weights.semibold};
  font-size: ${props => props.theme.typography.sizes.base};
  cursor: pointer;
  transition: all ${props => props.theme.transitions.fast};
  align-self: flex-start;
  box-shadow: ${props => props.theme.shadows.sm};

  &:hover {
    background: ${props => props.$danger ? '#FF2D20' : props.theme.colors.primaryHover};
    transform: translateY(-1px);
    box-shadow: ${props => props.theme.shadows.md};
  }

  &:disabled {
    background: ${props => props.theme.colors.textTertiary};
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const Alert = styled.div`
  padding: 1rem;
  border-radius: ${props => props.theme.radius.md};
  margin-bottom: 1rem;
  background: ${props => props.$error ? props.theme.colors.error + '20' : props.theme.colors.success + '20'};
  color: ${props => props.$error ? props.theme.colors.error : props.theme.colors.success};
  border: 1px solid ${props => props.$error ? props.theme.colors.error : props.theme.colors.success};
`;

const TicketsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const TicketCard = styled.div`
  background: #f9f9f9;
  border-radius: 8px;
  padding: 1.5rem;
  border-left: 4px solid ${props =>
    props.$status === 'open' ? '#3498db' :
    props.$status === 'resolved' ? '#2ecc71' :
    '#95a5a6'};
`;

const TicketHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
`;

const TicketType = styled.span`
  background: #131D4F;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
`;

const TicketStatus = styled.span`
  background: ${props =>
    props.$status === 'open' ? '#3498db' :
    props.$status === 'resolved' ? '#2ecc71' :
    '#95a5a6'};
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
`;

const TicketMessage = styled.p`
  color: #555;
  margin: 0.75rem 0;
  line-height: 1.6;
`;

const TicketDate = styled.p`
  color: #999;
  font-size: 0.85rem;
  margin: 0;
`;

const DangerZone = styled.div`
  border: 2px solid #e74c3c;
  border-radius: 10px;
  padding: 1.5rem;
  background: #fee;
`;

const WarningText = styled.p`
  color: #c0392b;
  font-weight: 600;
  margin-bottom: 1rem;
`;

const NoTickets = styled.div`
  text-align: center;
  padding: 2rem;
  color: #999;
  font-style: italic;
`;

const Support = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [ticketType, setTicketType] = useState('QA');
  const [message, setMessage] = useState('');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Scroll to top when component mounts or route changes
    window.scrollTo(0, 0);
    if (isAuthenticated) {
      fetchTickets();
    }
  }, [isAuthenticated]);

  const fetchTickets = async () => {
    try {
      const response = await supportAPI.getMyTickets();
      setTickets(response.data.tickets || []);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    }
  };

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await supportAPI.submitTicket({
        ticket_type: ticketType,
        message: message
      });

      setSuccess('Support ticket submitted successfully!');
      setMessage('');
      setTicketType('QA');
      fetchTickets();
    } catch (error) {
      console.error('Submit ticket error:', error);
      setError(error.response?.data?.message || 'Failed to submit support ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to deactivate your account?\n\n' +
      'Deactivating your account will:\n' +
      '• Log you out immediately\n' +
      '• Prevent you from logging in again\n' +
      '• Hide your profile from other users\n\n' +
      'Your purchase history and transaction records will be preserved.\n\n' +
      'Contact support to reactivate your account.'
    );

    if (!confirmed) return;

    const doubleConfirmed = window.confirm(
      'This is your final warning. Are you absolutely sure you want to deactivate your account?'
    );

    if (!doubleConfirmed) return;

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await supportAPI.deleteAccount(); // API endpoint remains the same

      setSuccess('Account deactivated successfully. Your data has been preserved. Redirecting...');
      localStorage.removeItem('auth_token');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('Deactivate account error:', error);
      setError(error.response?.data?.message || 'Failed to deactivate account');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPlaceholderText = () => {
    switch (ticketType) {
      case 'QA':
        return 'Ask your question here. Be as specific as possible...';
      case 'feedback':
        return 'Share your feedback or suggestions to help us improve...';
      case 'bug':
        return 'Describe the bug: What happened? What did you expect? Steps to reproduce...';
      case 'copyright':
        return 'Report copyright infringement. Please include:\n- URL of the infringing content\n- Proof of ownership\n- Description of your original work\n- Your contact information';
      case 'payment':
        return 'Describe your payment issue. Include order ID if available...';
      case 'download':
        return 'Describe the download problem. Which cheat sheet? What error did you see?';
      case 'account':
        return 'Describe the issue with your account...';
      case 'content_quality':
        return 'Report content quality concerns. Include the cheat sheet ID or title and describe the issue...';
      case 'refund':
        return 'Request a refund. Include order ID, purchase date, and reason for refund...';
      case 'other':
        return 'Describe your request or issue in detail...';
      default:
        return 'Describe your question, feedback, or issue in detail...';
    }
  };

  if (!isAuthenticated) {
    return (
      <Container>
        <Header>
          <Title>Support</Title>
          <Subtitle>Please login to access support</Subtitle>
        </Header>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>Support & Help</Title>
        <Subtitle>Submit a help request or manage your account</Subtitle>
      </Header>

      {error && <Alert $error>{error}</Alert>}
      {success && <Alert>{success}</Alert>}

      <Section>
        <SectionTitle>Submit Support Ticket</SectionTitle>
        <Form onSubmit={handleSubmitTicket}>
          <FormGroup>
            <Label htmlFor="ticketType">Request Type</Label>
            <Select
              id="ticketType"
              value={ticketType}
              onChange={(e) => setTicketType(e.target.value)}
              required
            >
              <option value="QA">Question & Answer</option>
              <option value="feedback">Feedback & Suggestions</option>
              <option value="bug">Bug Report</option>
              <option value="copyright">Copyright Infringement</option>
              <option value="payment">Payment Issue</option>
              <option value="download">Download Problem</option>
              <option value="account">Account Issue</option>
              <option value="content_quality">Content Quality Concern</option>
              <option value="refund">Refund Request</option>
              <option value="other">Other</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="message">Message</Label>
            <TextArea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={getPlaceholderText()}
              required
            />
          </FormGroup>

          <Button type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Ticket'}
          </Button>
        </Form>
      </Section>

      <Section>
        <SectionTitle>My Tickets</SectionTitle>
        {tickets.length === 0 ? (
          <NoTickets>No support tickets yet</NoTickets>
        ) : (
          <TicketsList>
            {tickets.map((ticket) => (
              <TicketCard key={ticket.ticket_id} $status={ticket.ticket_status}>
                <TicketHeader>
                  <TicketType>{ticket.ticket_type}</TicketType>
                  <TicketStatus $status={ticket.ticket_status}>
                    {ticket.ticket_status}
                  </TicketStatus>
                </TicketHeader>
                <TicketMessage>{ticket.message}</TicketMessage>
                <TicketDate>
                  Submitted: {formatDate(ticket.submitted_date)}
                </TicketDate>
              </TicketCard>
            ))}
          </TicketsList>
        )}
      </Section>

      <Section>
        <DangerZone>
          <SectionTitle style={{ color: '#c0392b' }}>Danger Zone</SectionTitle>
          <WarningText>
            ⚠️ Warning: Deactivating your account will prevent you from logging in.
            However, your purchase history and transaction records will be preserved.
            Contact support if you wish to reactivate your account.
          </WarningText>
          <Button $danger onClick={handleDeactivateAccount} disabled={loading}>
            Deactivate My Account
          </Button>
        </DangerZone>
      </Section>
    </Container>
  );
};

export default Support;
