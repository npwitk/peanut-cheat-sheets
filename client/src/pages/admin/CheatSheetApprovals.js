import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { adminAPI } from '../../services/api';
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

const CheatSheetsGrid = styled.div`
  display: grid;
  gap: 1.5rem;
`;

const CheatSheetCard = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.radius.xl};
  padding: 2rem;
  box-shadow: ${props => props.theme.shadows.md};
  border: 1px solid ${props => props.theme.colors.border};
  display: grid;
  grid-template-columns: ${props => props.$hasPreview ? '200px 1fr' : '1fr'};
  gap: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const PreviewImage = styled.img`
  width: 100%;
  height: 250px;
  object-fit: cover;
  border-radius: ${props => props.theme.radius.lg};
  background: ${props => props.theme.colors.backgroundSecondary};
`;

const CheatSheetInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const CheatSheetTitle = styled.h2`
  font-size: ${props => props.theme.typography.sizes.xl};
  color: ${props => props.theme.colors.text};
  font-weight: ${props => props.theme.typography.weights.bold};
  margin: 0;
`;

const CheatSheetMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: ${props => props.theme.typography.sizes.sm};
  color: ${props => props.theme.colors.textSecondary};
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;

  strong {
    color: ${props => props.theme.colors.text};
  }
`;

const Description = styled.p`
  color: ${props => props.theme.colors.text};
  line-height: ${props => props.theme.typography.lineHeights.relaxed};
  margin: 0;
`;

const CreatorInfo = styled.div`
  padding: 1rem;
  background: ${props => props.theme.colors.backgroundSecondary};
  border-radius: ${props => props.theme.radius.md};
  font-size: ${props => props.theme.typography.sizes.sm};
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
  min-height: 80px;
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

const Label = styled.div`
  font-size: ${props => props.theme.typography.sizes.sm};
  font-weight: ${props => props.theme.typography.weights.semibold};
  color: ${props => props.theme.colors.textSecondary};
  margin-bottom: 0.5rem;
`;

const CheatSheetApprovals = () => {
  const [cheatsheets, setCheatsheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectionReasons, setRejectionReasons] = useState({});
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    fetchPendingCheatsheets();
  }, []);

  const fetchPendingCheatsheets = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getPendingCheatsheets();
      setCheatsheets(response.data.cheatsheets);
    } catch (error) {
      console.error('Failed to fetch pending cheat sheets:', error);
      toast.error('Failed to load pending cheat sheets');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (cheatsheetId) => {
    if (!window.confirm('Are you sure you want to approve this cheat sheet? It will become visible on the browse page.')) {
      return;
    }

    try {
      setProcessing(prev => ({ ...prev, [cheatsheetId]: true }));
      await adminAPI.approveCheatsheet(cheatsheetId);
      toast.success('Cheat sheet approved successfully!');
      fetchPendingCheatsheets();
    } catch (error) {
      console.error('Failed to approve cheat sheet:', error);
      toast.error(error.response?.data?.message || 'Failed to approve cheat sheet');
    } finally {
      setProcessing(prev => ({ ...prev, [cheatsheetId]: false }));
    }
  };

  const handleReject = async (cheatsheetId) => {
    const reason = rejectionReasons[cheatsheetId] || '';

    if (!reason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    if (!window.confirm('Are you sure you want to reject this cheat sheet?')) {
      return;
    }

    try {
      setProcessing(prev => ({ ...prev, [cheatsheetId]: true }));
      await adminAPI.rejectCheatsheet(cheatsheetId, reason);
      toast.success('Cheat sheet rejected');
      fetchPendingCheatsheets();
      setRejectionReasons(prev => {
        const newReasons = { ...prev };
        delete newReasons[cheatsheetId];
        return newReasons;
      });
    } catch (error) {
      console.error('Failed to reject cheat sheet:', error);
      toast.error(error.response?.data?.message || 'Failed to reject cheat sheet');
    } finally {
      setProcessing(prev => ({ ...prev, [cheatsheetId]: false }));
    }
  };

  const handleReasonChange = (cheatsheetId, value) => {
    setRejectionReasons(prev => ({
      ...prev,
      [cheatsheetId]: value
    }));
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;

    // If the path is already a full URL (starts with http:// or https://), return it as-is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    // Otherwise, prepend the API URL for relative paths
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
    return `${baseUrl}${imagePath}`;
  };

  return (
    <Container>
      <Header>
        <Title>Cheat Sheet Approvals</Title>
        <Subtitle>Review and approve uploaded cheat sheets before they go live</Subtitle>
      </Header>

      {loading ? (
        <LoadingState>Loading pending cheat sheets...</LoadingState>
      ) : cheatsheets.length === 0 ? (
        <EmptyState>
          <EmptyIcon>📚</EmptyIcon>
          <EmptyText>No pending cheat sheets to review</EmptyText>
        </EmptyState>
      ) : (
        <CheatSheetsGrid>
          {cheatsheets.map(cs => (
            <CheatSheetCard key={cs.cheatsheet_id} $hasPreview={!!cs.preview_image_path}>
              {cs.preview_image_path && (
                <PreviewImage
                  src={getImageUrl(cs.preview_image_path)}
                  alt={cs.title}
                  loading="lazy"
                />
              )}

              <CheatSheetInfo>
                <div>
                  <CheatSheetTitle>{cs.title}</CheatSheetTitle>
                  <CheatSheetMeta>
                    <MetaItem>
                      <strong>Course:</strong> {cs.course_code}
                    </MetaItem>
                    {cs.semester && (
                      <MetaItem>
                        <strong>Semester:</strong> {cs.semester}
                      </MetaItem>
                    )}
                    {cs.academic_year && (
                      <MetaItem>
                        <strong>Year:</strong> {cs.academic_year}
                      </MetaItem>
                    )}
                    <MetaItem>
                      <strong>Price:</strong>{' '}
                      {parseFloat(cs.price) === 0 ? 'FREE' : `${parseFloat(cs.price).toFixed(2)} ฿`}
                    </MetaItem>
                  </CheatSheetMeta>
                </div>

                <Description>{cs.description}</Description>

                <CreatorInfo>
                  <strong>Uploaded by:</strong> {cs.creator_name} ({cs.creator_email})
                  <br />
                  <strong>Submitted:</strong> {new Date(cs.created_at).toLocaleString()}
                </CreatorInfo>

                <ActionSection>
                  <Label>Rejection Reason (required for rejection):</Label>
                  <TextArea
                    placeholder="Provide a reason if rejecting (e.g., poor quality, inappropriate content, copyright issues)..."
                    value={rejectionReasons[cs.cheatsheet_id] || ''}
                    onChange={(e) => handleReasonChange(cs.cheatsheet_id, e.target.value)}
                  />
                  <ButtonGroup>
                    <Button
                      $variant="approve"
                      onClick={() => handleApprove(cs.cheatsheet_id)}
                      disabled={processing[cs.cheatsheet_id]}
                    >
                      {processing[cs.cheatsheet_id] ? 'Processing...' : 'Approve'}
                    </Button>
                    <Button
                      $variant="reject"
                      onClick={() => handleReject(cs.cheatsheet_id)}
                      disabled={processing[cs.cheatsheet_id]}
                    >
                      {processing[cs.cheatsheet_id] ? 'Processing...' : 'Reject'}
                    </Button>
                  </ButtonGroup>
                </ActionSection>
              </CheatSheetInfo>
            </CheatSheetCard>
          ))}
        </CheatSheetsGrid>
      )}
    </Container>
  );
};

export default CheatSheetApprovals;
