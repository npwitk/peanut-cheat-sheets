import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { sellerApplicationAPI } from '../../services/api';
import toast from 'react-hot-toast';

const Container = styled.div`
  max-width: 1400px;
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
  color: ${props => props.theme.colors.textSecondary};
  font-size: ${props => props.theme.typography.sizes.base};
`;

const FilterTabs = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid ${props => props.theme.colors.border};
`;

const Tab = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  background: none;
  font-size: ${props => props.theme.typography.sizes.base};
  font-weight: ${props => props.theme.typography.weights.semibold};
  color: ${props => props.$active ? props.theme.colors.primary : props.theme.colors.textSecondary};
  cursor: pointer;
  border-bottom: 2px solid ${props => props.$active ? props.theme.colors.primary : 'transparent'};
  margin-bottom: -2px;
  transition: all ${props => props.theme.transitions.fast};

  &:hover {
    color: ${props => props.theme.colors.primary};
  }
`;

const ApplicationsGrid = styled.div`
  display: grid;
  gap: 1.5rem;
`;

const ApplicationCard = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.radius.xl};
  padding: 2rem;
  box-shadow: ${props => props.theme.shadows.md};
  border: 1px solid ${props => props.theme.colors.border};
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const UserInfo = styled.div`
  flex: 1;
`;

const UserName = styled.h3`
  font-size: ${props => props.theme.typography.sizes.xl};
  color: ${props => props.theme.colors.text};
  font-weight: ${props => props.theme.typography.weights.bold};
  margin-bottom: 0.25rem;
`;

const UserEmail = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  font-size: ${props => props.theme.typography.sizes.sm};
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 0.375rem 0.75rem;
  border-radius: ${props => props.theme.radius.full};
  font-size: ${props => props.theme.typography.sizes.sm};
  font-weight: ${props => props.theme.typography.weights.semibold};
  text-transform: uppercase;
  background: ${props => {
    if (props.status === 'pending') return props.theme.colors.warning;
    if (props.status === 'approved') return props.theme.colors.success;
    if (props.status === 'rejected') return props.theme.colors.error;
    return props.theme.colors.textTertiary;
  }};
  color: white;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
`;

const InfoItem = styled.div``;

const Label = styled.div`
  font-size: ${props => props.theme.typography.sizes.sm};
  font-weight: ${props => props.theme.typography.weights.semibold};
  color: ${props => props.theme.colors.textSecondary};
  margin-bottom: 0.25rem;
`;

const Value = styled.div`
  font-size: ${props => props.theme.typography.sizes.base};
  color: ${props => props.theme.colors.text};
  word-break: break-word;
`;

const BankAccountNumber = styled.div`
  font-family: monospace;
  font-size: ${props => props.theme.typography.sizes.base};
  color: ${props => props.theme.colors.text};
  background: ${props => props.theme.colors.backgroundSecondary};
  padding: 0.5rem 0.75rem;
  border-radius: ${props => props.theme.radius.md};
  letter-spacing: 0.05em;
`;

const ReasonBox = styled.div`
  background: ${props => props.theme.colors.backgroundSecondary};
  padding: 1rem;
  border-radius: ${props => props.theme.radius.md};
  margin-bottom: 1.5rem;
`;

const ReasonText = styled.p`
  color: ${props => props.theme.colors.text};
  line-height: ${props => props.theme.typography.lineHeights.relaxed};
  white-space: pre-wrap;
  margin: 0;
`;

const ActionSection = styled.div`
  border-top: 1px solid ${props => props.theme.colors.border};
  padding-top: 1.5rem;
  margin-top: 1.5rem;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.875rem;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.radius.md};
  font-size: ${props => props.theme.typography.sizes.base};
  min-height: 100px;
  resize: vertical;
  font-family: inherit;
  background: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.text};
  margin-bottom: 1rem;
  transition: all ${props => props.theme.transitions.fast};

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primaryLight};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: ${props => props.theme.radius.md};
  font-size: ${props => props.theme.typography.sizes.base};
  font-weight: ${props => props.theme.typography.weights.semibold};
  cursor: pointer;
  transition: all ${props => props.theme.transitions.fast};
  background: ${props => {
    if (props.$variant === 'approve') return props.theme.colors.success;
    if (props.$variant === 'reject') return props.theme.colors.error;
    return props.theme.colors.textTertiary;
  }};
  color: white;
  box-shadow: ${props => props.theme.shadows.sm};

  &:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
    box-shadow: ${props => props.theme.shadows.md};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: ${props => props.theme.colors.textSecondary};
`;

const EmptyIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
`;

const EmptyText = styled.p`
  font-size: ${props => props.theme.typography.sizes.lg};
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 3rem;
  color: ${props => props.theme.colors.textSecondary};
`;

const AdminNotesBox = styled.div`
  background: ${props => props.status === 'approved'
    ? props.theme.colors.success + '20'
    : props.theme.colors.error + '20'};
  padding: 1rem;
  border-radius: ${props => props.theme.radius.md};
  border-left: 4px solid ${props => props.status === 'approved'
    ? props.theme.colors.success
    : props.theme.colors.error};
  margin-bottom: 1.5rem;
`;

const SellerApprovals = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [adminNotes, setAdminNotes] = useState({});
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    fetchApplications();
  }, [filter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await sellerApplicationAPI.getAll({ status: filter });
      setApplications(response.data.applications);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (applicationId) => {
    const notes = adminNotes[applicationId] || '';

    if (!window.confirm('Are you sure you want to approve this seller application? This will grant seller status to the user.')) {
      return;
    }

    try {
      setProcessing(prev => ({ ...prev, [applicationId]: true }));
      await sellerApplicationAPI.approve(applicationId, notes);
      toast.success('Application approved successfully!');
      fetchApplications();
      setAdminNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[applicationId];
        return newNotes;
      });
    } catch (error) {
      console.error('Failed to approve application:', error);
      toast.error(error.response?.data?.message || 'Failed to approve application');
    } finally {
      setProcessing(prev => ({ ...prev, [applicationId]: false }));
    }
  };

  const handleReject = async (applicationId) => {
    const notes = adminNotes[applicationId] || '';

    if (!notes.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    if (!window.confirm('Are you sure you want to reject this seller application?')) {
      return;
    }

    try {
      setProcessing(prev => ({ ...prev, [applicationId]: true }));
      await sellerApplicationAPI.reject(applicationId, notes);
      toast.success('Application rejected');
      fetchApplications();
      setAdminNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[applicationId];
        return newNotes;
      });
    } catch (error) {
      console.error('Failed to reject application:', error);
      toast.error(error.response?.data?.message || 'Failed to reject application');
    } finally {
      setProcessing(prev => ({ ...prev, [applicationId]: false }));
    }
  };

  const handleNotesChange = (applicationId, value) => {
    setAdminNotes(prev => ({
      ...prev,
      [applicationId]: value
    }));
  };

  return (
    <Container>
      <Header>
        <Title>Seller Applications</Title>
        <Subtitle>Review and manage seller applications</Subtitle>
      </Header>

      <FilterTabs>
        <Tab $active={filter === 'pending'} onClick={() => setFilter('pending')}>
          Pending
        </Tab>
        <Tab $active={filter === 'approved'} onClick={() => setFilter('approved')}>
          Approved
        </Tab>
        <Tab $active={filter === 'rejected'} onClick={() => setFilter('rejected')}>
          Rejected
        </Tab>
      </FilterTabs>

      {loading ? (
        <LoadingState>Loading applications...</LoadingState>
      ) : applications.length === 0 ? (
        <EmptyState>
          <EmptyIcon>📋</EmptyIcon>
          <EmptyText>No {filter} applications found</EmptyText>
        </EmptyState>
      ) : (
        <ApplicationsGrid>
          {applications.map(app => (
            <ApplicationCard key={app.application_id}>
              <CardHeader>
                <UserInfo>
                  <UserName>{app.user_name}</UserName>
                  <UserEmail>{app.user_email}</UserEmail>
                </UserInfo>
                <StatusBadge status={app.status}>{app.status}</StatusBadge>
              </CardHeader>

              <InfoGrid>
                <InfoItem>
                  <Label>Full Name</Label>
                  <Value>{app.full_name}</Value>
                </InfoItem>

                <InfoItem>
                  <Label>Bank</Label>
                  <Value>{app.bank_name}</Value>
                </InfoItem>

                <InfoItem>
                  <Label>Account Holder Name</Label>
                  <Value>{app.bank_account_name}</Value>
                </InfoItem>

                <InfoItem>
                  <Label>Bank Account Number</Label>
                  <BankAccountNumber>
                    {app.bank_account_number || '[Encrypted]'}
                  </BankAccountNumber>
                </InfoItem>

                {app.phone_number && (
                  <InfoItem>
                    <Label>Phone Number</Label>
                    <Value>{app.phone_number}</Value>
                  </InfoItem>
                )}

                <InfoItem>
                  <Label>Submitted At</Label>
                  <Value>{new Date(app.submitted_at).toLocaleString()}</Value>
                </InfoItem>
              </InfoGrid>

              {app.reason && (
                <>
                  <Label>Why they want to become a seller:</Label>
                  <ReasonBox>
                    <ReasonText>{app.reason}</ReasonText>
                  </ReasonBox>
                </>
              )}

              {app.status === 'pending' ? (
                <ActionSection>
                  <Label>Admin Notes (optional for approval, required for rejection):</Label>
                  <TextArea
                    placeholder="Add notes about this application..."
                    value={adminNotes[app.application_id] || ''}
                    onChange={(e) => handleNotesChange(app.application_id, e.target.value)}
                  />
                  <ButtonGroup>
                    <Button
                      $variant="approve"
                      onClick={() => handleApprove(app.application_id)}
                      disabled={processing[app.application_id]}
                    >
                      {processing[app.application_id] ? 'Processing...' : 'Approve'}
                    </Button>
                    <Button
                      $variant="reject"
                      onClick={() => handleReject(app.application_id)}
                      disabled={processing[app.application_id]}
                    >
                      {processing[app.application_id] ? 'Processing...' : 'Reject'}
                    </Button>
                  </ButtonGroup>
                </ActionSection>
              ) : (
                <>
                  {app.admin_notes && (
                    <AdminNotesBox status={app.status}>
                      <Label>Admin Notes:</Label>
                      <ReasonText>{app.admin_notes}</ReasonText>
                    </AdminNotesBox>
                  )}
                  {app.reviewed_at && (
                    <InfoItem>
                      <Label>Reviewed At</Label>
                      <Value>
                        {new Date(app.reviewed_at).toLocaleString()}
                        {app.reviewed_by_name && ` by ${app.reviewed_by_name}`}
                      </Value>
                    </InfoItem>
                  )}
                </>
              )}
            </ApplicationCard>
          ))}
        </ApplicationsGrid>
      )}
    </Container>
  );
};

export default SellerApprovals;
