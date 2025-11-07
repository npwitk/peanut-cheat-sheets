import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { purchasesAPI, paymentsAPI } from '../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const Container = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
  min-height: calc(100vh - 60px);
  background: ${props => props.theme.colors.background};
`;

const Title = styled.h1`
  font-size: ${props => props.theme.typography.sizes['3xl']};
  margin-bottom: 2rem;
  color: ${props => props.theme.colors.text};
  font-weight: ${props => props.theme.typography.weights.bold};
`;

const PurchaseCard = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.radius.lg};
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: ${props => props.theme.shadows.md};
  border: 1px solid ${props => props.theme.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all ${props => props.theme.transitions.fast};

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.lg};
  }

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
`;

const Info = styled.div`
  flex: 1;
`;

const CourseCode = styled.span`
  background: ${props => props.theme.colors.primary};
  color: white;
  padding: 0.375rem 0.875rem;
  border-radius: ${props => props.theme.radius.full};
  font-size: ${props => props.theme.typography.sizes.xs};
  font-weight: ${props => props.theme.typography.weights.semibold};
  margin-right: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.02em;
`;

const CheatSheetTitle = styled.h3`
  font-size: ${props => props.theme.typography.sizes.lg};
  margin: 0.5rem 0;
  color: ${props => props.theme.colors.text};
  font-weight: ${props => props.theme.typography.weights.semibold};
`;

const Meta = styled.div`
  color: ${props => props.theme.colors.textSecondary};
  font-size: ${props => props.theme.typography.sizes.sm};
  margin-top: 0.5rem;
`;

const Status = styled.span`
  display: inline-block;
  padding: 0.375rem 0.875rem;
  border-radius: ${props => props.theme.radius.full};
  font-size: ${props => props.theme.typography.sizes.xs};
  font-weight: ${props => props.theme.typography.weights.semibold};
  background: ${props => {
    switch(props.status) {
      case 'paid': return props.theme.colors.success;
      case 'pending': return props.theme.colors.warning;
      case 'failed': return props.theme.colors.error;
      default: return props.theme.colors.textTertiary;
    }
  }};
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.02em;
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Button = styled.button`
  background: ${props => props.disabled ? props.theme.colors.textTertiary : props.theme.colors.primary};
  color: white;
  border: none;
  padding: 0.875rem 1.5rem;
  border-radius: ${props => props.theme.radius.md};
  font-weight: ${props => props.theme.typography.weights.semibold};
  font-size: ${props => props.theme.typography.sizes.base};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all ${props => props.theme.transitions.fast};
  box-shadow: ${props => props.disabled ? 'none' : props.theme.shadows.sm};

  &:hover {
    background: ${props => props.disabled ? props.theme.colors.textTertiary : props.theme.colors.primaryHover};
    transform: ${props => props.disabled ? 'none' : 'translateY(-1px)'};
    box-shadow: ${props => props.disabled ? 'none' : props.theme.shadows.md};
  }

  &:active {
    transform: ${props => props.disabled ? 'none' : 'translateY(0)'};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: ${props => props.theme.colors.textSecondary};

  h2 {
    font-size: ${props => props.theme.typography.sizes['2xl']};
    margin-bottom: 1rem;
    color: ${props => props.theme.colors.text};
    font-weight: ${props => props.theme.typography.weights.semibold};
  }

  p {
    margin-bottom: 2rem;
    font-size: ${props => props.theme.typography.sizes.base};
  }
`;

const QRModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-in;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const QRContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 10px;
  max-width: 500px;
  text-align: center;
  animation: slideUp 0.3s ease-out;

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  h2 {
    color: #131D4F;
    margin-bottom: 1rem;
  }
`;

const QRImage = styled.img`
  width: 300px;
  height: 300px;
  margin: 1rem 0;
`;

const Instructions = styled.div`
  text-align: left;
  background: #f8f8f8;
  padding: 1rem;
  border-radius: 5px;
  margin-top: 1rem;
  color: #333;

  ol {
    margin-left: 1.5rem;
    li {
      margin-bottom: 0.5rem;
    }
  }
`;

const SmallButton = styled.button`
  background: ${props => props.theme.colors.warning};
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: ${props => props.theme.radius.md};
  font-weight: ${props => props.theme.typography.weights.semibold};
  font-size: ${props => props.theme.typography.sizes.sm};
  cursor: pointer;
  transition: all ${props => props.theme.transitions.fast};
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    background: ${props => props.theme.colors.warningHover || '#e6a800'};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const MyPurchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingOrderId, setDownloadingOrderId] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [qrData, setQrData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Scroll to top when component mounts or route changes
    window.scrollTo(0, 0);
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      const response = await purchasesAPI.getMyPurchases();
      setPurchases(response.data.purchases);
    } catch (error) {
      console.error('Failed to fetch purchases:', error);
      toast.error('Failed to load purchases');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (orderId, title) => {
    setDownloadingOrderId(orderId);

    // Show loading toast
    const downloadToast = toast.loading('Downloading PDF... Please wait, this may take a moment for large files.');

    try {
      const response = await purchasesAPI.downloadCheatSheet(orderId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${title}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      // Dismiss loading toast and show success
      toast.success('Download completed successfully!', { id: downloadToast });

      // Refresh purchases to update download count
      fetchPurchases();
    } catch (error) {
      console.error('Download failed:', error);
      // Dismiss loading toast and show error
      toast.error(error.response?.data?.message || 'Download failed', { id: downloadToast });
    } finally {
      setDownloadingOrderId(null);
    }
  };

  const handleShowQR = async (orderId) => {
    try {
      const response = await paymentsAPI.getQRCode(orderId);
      setQrData(response.data);
      setShowQR(true);
    } catch (error) {
      console.error('Failed to retrieve QR code:', error);
      toast.error(error.response?.data?.message || 'Failed to retrieve QR code');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (purchases.length === 0) {
    return (
      <Container>
        <EmptyState>
          <h2>No Purchases Yet</h2>
          <p>You haven't purchased any cheat sheets yet.</p>
          <Button onClick={() => navigate('/')}>
            Browse Cheat Sheets
          </Button>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <Title>My Library</Title>
      <Meta style={{ marginTop: '-1rem', marginBottom: '2rem', fontSize: '0.95rem' }}>
        All your purchased cheat sheets in one place
      </Meta>

      {purchases.map((purchase) => (
        <PurchaseCard key={purchase.order_id}>
          <Info>
            <div>
              <CourseCode>{purchase.course_code}</CourseCode>
              <Status status={purchase.payment_status}>
                {purchase.payment_status.toUpperCase()}
              </Status>
            </div>
            <CheatSheetTitle>{purchase.title}</CheatSheetTitle>
            <Meta>
              Purchased: {new Date(purchase.purchase_date).toLocaleDateString()}
              {' • '}
              Amount: {parseFloat(purchase.payment_amount || 0).toFixed(2)} ฿
              {' • '}
              Downloads: {purchase.download_count || 0}
            </Meta>
          </Info>

          <Actions>
            {purchase.payment_status === 'paid' ? (
              <Button
                onClick={() => handleDownload(purchase.order_id, purchase.title)}
                disabled={downloadingOrderId === purchase.order_id}
              >
                {downloadingOrderId === purchase.order_id ? 'Downloading...' : 'Download PDF'}
              </Button>
            ) : purchase.payment_status === 'pending' ? (
              <>
                <Button disabled>Pending Approval</Button>
                <SmallButton onClick={() => handleShowQR(purchase.order_id)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7"/>
                    <rect x="14" y="3" width="7" height="7"/>
                    <rect x="14" y="14" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/>
                  </svg>
                  Show QR Code
                </SmallButton>
              </>
            ) : (
              <Button disabled>Payment {purchase.payment_status}</Button>
            )}
            <Button
              onClick={() => navigate(`/cheatsheet/${purchase.cheatsheet_id}`)}
              style={{ background: 'transparent', color: '#131D4F', border: '2px solid #131D4F' }}
            >
              View Details
            </Button>
          </Actions>
        </PurchaseCard>
      ))}

      {showQR && qrData && (
        <QRModal onClick={() => setShowQR(false)}>
          <QRContent onClick={(e) => e.stopPropagation()}>
            <h2>Scan to Pay</h2>
            <QRImage src={qrData.qr_code} alt="PromptPay QR Code" />
            <p>
              <strong>{qrData.title}</strong>
              <br />
              Amount: <strong>{parseFloat(qrData.amount || 0).toFixed(2)} ฿</strong>
            </p>
            <Instructions>
              <ol>
                <li>{qrData.instructions.step1}</li>
                <li>{qrData.instructions.step2}</li>
                <li>{qrData.instructions.step3}</li>
                <li>{qrData.instructions.step4}</li>
                <li>{qrData.instructions.step5}</li>
              </ol>
            </Instructions>
            <Button onClick={() => setShowQR(false)} style={{ marginTop: '1rem', width: '100%' }}>
              Close
            </Button>
          </QRContent>
        </QRModal>
      )}
    </Container>
  );
};

export default MyPurchases;
