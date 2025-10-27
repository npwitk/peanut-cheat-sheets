import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { sellerApplicationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  min-height: calc(100vh - 60px);
  background: ${props => props.theme.colors.background};
`;

const Card = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.radius.xl};
  padding: 2.5rem;
  box-shadow: ${props => props.theme.shadows.md};
  border: 1px solid ${props => props.theme.colors.border};

  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

const Title = styled.h1`
  font-size: ${props => props.theme.typography.sizes['3xl']};
  margin-bottom: 0.5rem;
  color: ${props => props.theme.colors.text};
  font-weight: ${props => props.theme.typography.weights.bold};
`;

const Subtitle = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  margin-bottom: 2rem;
  font-size: ${props => props.theme.typography.sizes.base};
  line-height: ${props => props.theme.typography.lineHeights.relaxed};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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

  span {
    color: ${props => props.theme.colors.error};
  }
`;

const Input = styled.input`
  padding: 0.875rem;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.radius.md};
  font-size: ${props => props.theme.typography.sizes.base};
  background: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.text};
  transition: all ${props => props.theme.transitions.fast};

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primaryLight};
  }

  &:disabled {
    background: ${props => props.theme.colors.backgroundSecondary};
    cursor: not-allowed;
    opacity: 0.6;
  }
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
  min-height: 100px;
  resize: vertical;
  font-family: inherit;
  background: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.text};
  transition: all ${props => props.theme.transitions.fast};

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primaryLight};
  }
`;

const HelpText = styled.div`
  font-size: ${props => props.theme.typography.sizes.sm};
  color: ${props => props.theme.colors.textSecondary};
  margin-top: 0.25rem;
`;

const Button = styled.button`
  padding: 0.875rem 2rem;
  border: none;
  border-radius: ${props => props.theme.radius.md};
  font-size: ${props => props.theme.typography.sizes.base};
  font-weight: ${props => props.theme.typography.weights.semibold};
  cursor: pointer;
  transition: all ${props => props.theme.transitions.fast};
  background: ${props => props.theme.colors.primary};
  color: white;
  box-shadow: ${props => props.theme.shadows.sm};

  &:hover {
    background: ${props => props.theme.colors.primaryHover};
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

const StatusCard = styled.div`
  padding: 1.5rem;
  border-radius: ${props => props.theme.radius.lg};
  background: ${props => {
    if (props.status === 'pending') return props.theme.colors.warning + '20';
    if (props.status === 'approved') return props.theme.colors.success + '20';
    if (props.status === 'rejected') return props.theme.colors.error + '20';
    return props.theme.colors.backgroundSecondary;
  }};
  border: 1px solid ${props => {
    if (props.status === 'pending') return props.theme.colors.warning;
    if (props.status === 'approved') return props.theme.colors.success;
    if (props.status === 'rejected') return props.theme.colors.error;
    return props.theme.colors.border;
  }};
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

const THAI_BANKS = [
  'Bangkok Bank',
  'Kasikornbank (K-Bank)',
  'Siam Commercial Bank (SCB)',
  'Krung Thai Bank',
  'Bank of Ayudhya (Krungsri)',
  'TMB Bank',
  'Government Savings Bank',
  'CIMB Thai Bank',
  'United Overseas Bank (UOB)',
  'Thanachart Bank',
  'Standard Chartered Bank',
  'ICBC (Thai)',
  'Other'
];

const ApplyToBeSeller = () => {
  const { user, isSeller } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [existingApplication, setExistingApplication] = useState(null);
  const [formData, setFormData] = useState({
    full_name: user?.name || '',
    bank_name: '',
    bank_account_number: '',
    bank_account_name: '',
    phone_number: '',
    reason: ''
  });

  useEffect(() => {
    // Scroll to top when component mounts or route changes
    window.scrollTo(0, 0);

    // Redirect if already a seller
    if (isSeller) {
      toast.success('You are already a seller!');
      navigate('/admin/upload');
      return;
    }

    // Check for existing application
    fetchExistingApplication();
  }, [isSeller, navigate]);

  const fetchExistingApplication = async () => {
    try {
      const response = await sellerApplicationAPI.getMy();
      setExistingApplication(response.data.application);
    } catch (error) {
      // No application found - that's okay
      if (error.response?.status !== 404) {
        console.error('Failed to fetch application:', error);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.full_name || !formData.bank_name || !formData.bank_account_number || !formData.bank_account_name) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate account number (digits only, reasonable length)
    const accountNumber = formData.bank_account_number.replace(/\s|-/g, '');
    if (!/^\d{10,15}$/.test(accountNumber)) {
      toast.error('Please enter a valid bank account number (10-15 digits)');
      return;
    }

    setLoading(true);

    try {
      await sellerApplicationAPI.submit({
        ...formData,
        bank_account_number: accountNumber
      });

      toast.success('Application submitted successfully! We will review it soon.');
      navigate('/');
    } catch (error) {
      console.error('Submit application error:', error);
      toast.error(error.response?.data?.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  // Show existing application status
  if (existingApplication) {
    return (
      <Container>
        <Card>
          <Title>Seller Application Status</Title>
          <Subtitle>Your application to become a seller</Subtitle>

          <StatusCard status={existingApplication.status}>
            <div style={{ marginBottom: '1rem' }}>
              <StatusBadge status={existingApplication.status}>
                {existingApplication.status}
              </StatusBadge>
            </div>

            <FormGroup>
              <Label>Full Name</Label>
              <div>{existingApplication.full_name}</div>
            </FormGroup>

            <FormGroup>
              <Label>Bank</Label>
              <div>{existingApplication.bank_name}</div>
            </FormGroup>

            <FormGroup>
              <Label>Account Holder Name</Label>
              <div>{existingApplication.bank_account_name}</div>
            </FormGroup>

            {existingApplication.phone_number && (
              <FormGroup>
                <Label>Phone Number</Label>
                <div>{existingApplication.phone_number}</div>
              </FormGroup>
            )}

            {existingApplication.reason && (
              <FormGroup>
                <Label>Reason</Label>
                <div>{existingApplication.reason}</div>
              </FormGroup>
            )}

            <FormGroup>
              <Label>Submitted At</Label>
              <div>{new Date(existingApplication.submitted_at).toLocaleString()}</div>
            </FormGroup>

            {existingApplication.reviewed_at && (
              <FormGroup>
                <Label>Reviewed At</Label>
                <div>{new Date(existingApplication.reviewed_at).toLocaleString()}</div>
              </FormGroup>
            )}

            {existingApplication.admin_notes && (
              <FormGroup>
                <Label>Admin Notes</Label>
                <div style={{
                  padding: '0.875rem',
                  background: 'rgba(0,0,0,0.05)',
                  borderRadius: '8px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {existingApplication.admin_notes}
                </div>
              </FormGroup>
            )}
          </StatusCard>

          {existingApplication.status === 'pending' && (
            <HelpText style={{ marginTop: '1rem', textAlign: 'center' }}>
              Your application is being reviewed. Please wait for admin approval.
            </HelpText>
          )}

          {existingApplication.status === 'rejected' && (
            <HelpText style={{ marginTop: '1rem', textAlign: 'center', color: 'red' }}>
              Your application was rejected. You can submit a new application if you address the concerns above.
            </HelpText>
          )}
        </Card>
      </Container>
    );
  }

  // Show application form
  return (
    <Container>
      <Card>
        <Title>Apply to Become a Seller</Title>
        <Subtitle>
          Share your knowledge and earn by selling cheat sheets on our platform.
          Once approved, you'll be able to upload and sell your materials.
        </Subtitle>

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>
              Full Name <span>*</span>
            </Label>
            <Input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              disabled
              required
            />
            <HelpText>This is your name from your Google account</HelpText>
          </FormGroup>

          <FormGroup>
            <Label>
              Bank Name <span>*</span>
            </Label>
            <Select
              name="bank_name"
              value={formData.bank_name}
              onChange={handleInputChange}
              required
            >
              <option value="">Select your bank</option>
              {THAI_BANKS.map(bank => (
                <option key={bank} value={bank}>{bank}</option>
              ))}
            </Select>
            <HelpText>Select the bank where you want to receive payments</HelpText>
          </FormGroup>

          <FormGroup>
            <Label>
              Bank Account Number <span>*</span>
            </Label>
            <Input
              type="text"
              name="bank_account_number"
              placeholder="1234567890"
              value={formData.bank_account_number}
              onChange={handleInputChange}
              maxLength="20"
              required
            />
            <HelpText>Enter your bank account number (10-15 digits). This will be encrypted.</HelpText>
          </FormGroup>

          <FormGroup>
            <Label>
              Account Holder Name <span>*</span>
            </Label>
            <Input
              type="text"
              name="bank_account_name"
              placeholder="Enter name as shown on bank account"
              value={formData.bank_account_name}
              onChange={handleInputChange}
              required
            />
            <HelpText>Name registered with your bank account</HelpText>
          </FormGroup>

          <FormGroup>
            <Label>Phone Number</Label>
            <Input
              type="tel"
              name="phone_number"
              placeholder="0812345678"
              value={formData.phone_number}
              onChange={handleInputChange}
              maxLength="15"
            />
            <HelpText>Optional - for admin to contact you if needed</HelpText>
          </FormGroup>

          <FormGroup>
            <Label>Why do you want to become a seller?</Label>
            <TextArea
              name="reason"
              placeholder="Tell us why you want to sell cheat sheets (optional)"
              value={formData.reason}
              onChange={handleInputChange}
            />
            <HelpText>Optional - helps us understand your motivation</HelpText>
          </FormGroup>

          <Button type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Application'}
          </Button>

          <HelpText style={{ textAlign: 'center' }}>
            By submitting this application, you agree to our terms and conditions for sellers.
            Your bank account information will be securely encrypted.
          </HelpText>
        </Form>
      </Card>
    </Container>
  );
};

export default ApplyToBeSeller;
