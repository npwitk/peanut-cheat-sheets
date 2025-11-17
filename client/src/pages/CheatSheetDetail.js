import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { cheatSheetsAPI, paymentsAPI, purchasesAPI, cartAPI, reviewsAPI, authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import { StarIcon, EyeIcon, CartIcon, InfoIcon } from '../components/Icons';
import StarRating from '../components/StarRating';
import YouTubeEmbed from '../components/YouTubeEmbed';
import LoadingSpinner from '../components/LoadingSpinner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
  min-height: calc(100vh - 60px);
  background: ${props => props.theme.colors.background};
  transition: background ${props => props.theme.transitions.normal};
`;

const Card = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.radius.xl};
  padding: 2.5rem;
  box-shadow: ${props => props.theme.shadows.md};
  border: 1px solid ${props => props.theme.colors.border};
  transition: all ${props => props.theme.transitions.normal};

  @media (max-width: 768px) {
    padding: 1.5rem;
    border-radius: ${props => props.theme.radius.lg};
  }
`;

const Header = styled.div`
  border-bottom: 1px solid ${props => props.theme.colors.borderLight};
  padding-bottom: 2rem;
  margin-bottom: 2rem;
`;

const HeaderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.25rem;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const HeaderContent = styled.div`
  flex: 1;
`;

const EditButton = styled.button`
  background: ${props => props.theme.colors.backgroundSecondary};
  color: ${props => props.theme.colors.text};
  border: 1px solid ${props => props.theme.colors.border};
  padding: 0.625rem 1.25rem;
  border-radius: ${props => props.theme.radius.md};
  font-size: ${props => props.theme.typography.sizes.sm};
  font-weight: ${props => props.theme.typography.weights.semibold};
  cursor: pointer;
  transition: all ${props => props.theme.transitions.fast};
  white-space: nowrap;

  &:hover {
    background: ${props => props.theme.colors.primary};
    color: white;
    border-color: ${props => props.theme.colors.primary};
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const BadgeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
`;

const CourseCode = styled.span`
  background: ${props => props.theme.colors.primary};
  color: white;
  padding: 0.5rem 1.125rem;
  border-radius: ${props => props.theme.radius.full};
  font-weight: ${props => props.theme.typography.weights.semibold};
  font-size: ${props => props.theme.typography.sizes.sm};
  display: inline-flex;
  align-items: center;
  letter-spacing: 0.01em;
  transition: background ${props => props.theme.transitions.fast};

  &:hover {
    background: ${props => props.theme.colors.primaryHover};
  }
`;

const Title = styled.h1`
  font-size: ${props => props.theme.typography.sizes['3xl']};
  margin-bottom: 1.25rem;
  color: ${props => props.theme.colors.text};
  font-weight: ${props => props.theme.typography.weights.bold};
  line-height: ${props => props.theme.typography.lineHeights.tight};
  letter-spacing: -0.02em;

  @media (max-width: 768px) {
    font-size: ${props => props.theme.typography.sizes['2xl']};
  }
`;

const Meta = styled.div`
  display: flex;
  gap: 1.5rem;
  color: ${props => props.theme.colors.textSecondary};
  font-size: ${props => props.theme.typography.sizes.sm};
  flex-wrap: wrap;

  span {
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }
`;

const UploaderInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: ${props => props.theme.colors.backgroundSecondary};
  border-radius: ${props => props.theme.radius.md};
  border: 1px solid ${props => props.theme.colors.borderLight};
  margin-bottom: 1.5rem;
`;

const UploaderAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: ${props => props.theme.typography.weights.bold};
  font-size: ${props => props.theme.typography.sizes.sm};
  overflow: hidden;
`;

const UploaderAvatarImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const UploaderDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const UploaderLabel = styled.span`
  font-size: ${props => props.theme.typography.sizes.xs};
  color: ${props => props.theme.colors.textTertiary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: ${props => props.theme.typography.weights.semibold};
`;

const UploaderName = styled.span`
  font-size: ${props => props.theme.typography.sizes.base};
  color: ${props => props.theme.colors.text};
  font-weight: ${props => props.theme.typography.weights.medium};
`;

const Description = styled.div`
  font-size: ${props => props.theme.typography.sizes.lg};
  line-height: ${props => props.theme.typography.lineHeights.relaxed};
  color: ${props => props.theme.colors.textSecondary};
  margin-bottom: 2rem;

  /* Markdown styles */
  p {
    margin-bottom: 1rem;
  }

  ul, ol {
    margin-left: 1.5rem;
    margin-bottom: 1rem;
  }

  li {
    margin-bottom: 0.5rem;
  }

  strong {
    font-weight: ${props => props.theme.typography.weights.bold};
    color: ${props => props.theme.colors.text};
  }

  em {
    font-style: italic;
  }

  code {
    background: ${props => props.theme.colors.backgroundSecondary};
    padding: 0.125rem 0.375rem;
    border-radius: ${props => props.theme.radius.sm};
    font-family: 'Courier New', monospace;
    font-size: 0.9em;
  }

  pre {
    background: ${props => props.theme.colors.backgroundSecondary};
    padding: 1rem;
    border-radius: ${props => props.theme.radius.md};
    overflow-x: auto;
    margin-bottom: 1rem;

    code {
      background: none;
      padding: 0;
    }
  }

  blockquote {
    border-left: 4px solid ${props => props.theme.colors.primary};
    padding-left: 1rem;
    margin-left: 0;
    margin-bottom: 1rem;
    font-style: italic;
  }

  h1, h2, h3 {
    color: ${props => props.theme.colors.text};
    font-weight: ${props => props.theme.typography.weights.bold};
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
  }

  h1 { font-size: ${props => props.theme.typography.sizes['2xl']}; }
  h2 { font-size: ${props => props.theme.typography.sizes.xl}; }
  h3 { font-size: ${props => props.theme.typography.sizes.lg}; }

  a {
    color: ${props => props.theme.colors.primary};
    text-decoration: underline;

    &:hover {
      color: ${props => props.theme.colors.primaryHover};
    }
  }

  hr {
    border: none;
    border-top: 1px solid ${props => props.theme.colors.border};
    margin: 1.5rem 0;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1rem;
  }

  th, td {
    border: 1px solid ${props => props.theme.colors.border};
    padding: 0.5rem;
    text-align: left;
  }

  th {
    background: ${props => props.theme.colors.backgroundSecondary};
    font-weight: ${props => props.theme.typography.weights.semibold};
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const InfoItem = styled.div`
  padding: 1.125rem;
  background: ${props => props.theme.colors.backgroundSecondary};
  border-radius: ${props => props.theme.radius.md};
  border: 1px solid ${props => props.theme.colors.borderLight};
  transition: all ${props => props.theme.transitions.fast};

  &:hover {
    background: ${props => props.theme.colors.backgroundTertiary};
    transform: translateY(-1px);
  }

  strong {
    display: block;
    color: ${props => props.theme.colors.text};
    font-weight: ${props => props.theme.typography.weights.semibold};
    font-size: ${props => props.theme.typography.sizes.sm};
    margin-bottom: 0.375rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  span {
    color: ${props => props.theme.colors.textSecondary};
    font-size: ${props => props.theme.typography.sizes.base};
    font-weight: ${props => props.theme.typography.weights.medium};
  }
`;

const PriceSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.75rem;
  background: ${props => props.theme.colors.primaryLight};
  border-radius: ${props => props.theme.radius.lg};
  margin-top: 2rem;
  border: 1px solid ${props => props.theme.colors.borderLight};
  transition: all ${props => props.theme.transitions.normal};

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1.25rem;
    text-align: center;
  }
`;

const Price = styled.div`
  font-size: ${props => props.theme.typography.sizes['4xl']};
  font-weight: ${props => props.theme.typography.weights.bold};
  color: ${props => props.theme.colors.primary};
  letter-spacing: -0.02em;

  @media (max-width: 768px) {
    font-size: ${props => props.theme.typography.sizes['3xl']};
  }
`;

const Button = styled.button`
  background: ${props => props.disabled ? props.theme.colors.textTertiary : props.theme.colors.primary};
  color: white;
  border: none;
  padding: 0.875rem 2rem;
  border-radius: ${props => props.theme.radius.md};
  font-size: ${props => props.theme.typography.sizes.base};
  font-weight: ${props => props.theme.typography.weights.semibold};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all ${props => props.theme.transitions.fast};
  box-shadow: ${props => props.disabled ? 'none' : props.theme.shadows.sm};
  letter-spacing: 0.01em;

  &:hover {
    background: ${props => props.disabled ? props.theme.colors.textTertiary : props.theme.colors.primaryHover};
    transform: ${props => props.disabled ? 'none' : 'translateY(-1px)'};
    box-shadow: ${props => props.disabled ? 'none' : props.theme.shadows.md};
  }

  &:active {
    transform: ${props => props.disabled ? 'none' : 'translateY(0)'};
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
`;

const QRContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 10px;
  max-width: 500px;
  text-align: center;
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

  ol {
    margin-left: 1.5rem;
    li {
      margin-bottom: 0.5rem;
    }
  }
`;

const Badge = styled.span`
  background: ${props => props.theme.colors.success};
  color: white;
  padding: 0.5rem 1.125rem;
  border-radius: ${props => props.theme.radius.full};
  font-weight: ${props => props.theme.typography.weights.semibold};
  font-size: ${props => props.theme.typography.sizes.sm};
  display: inline-flex;
  align-items: center;
  letter-spacing: 0.02em;
  box-shadow: ${props => props.theme.shadows.sm};
`;

const PreviewSection = styled.div`
  margin: 2rem 0;
  text-align: center;
`;

const PreviewImage = styled.img`
  max-width: 100%;
  height: auto;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
`;

const PreviewTitle = styled.h3`
  font-size: 1.25rem;
  margin-bottom: 1rem;
  color: #333;
`;

const YouTubeSection = styled.div`
  margin-top: 2.5rem;
`;

const YouTubeTitle = styled.h3`
  font-size: ${props => props.theme.typography.sizes.xl};
  font-weight: ${props => props.theme.typography.weights.bold};
  color: ${props => props.theme.colors.text};
  margin-bottom: 1.5rem;
`;

const YouTubeGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;

  @media (min-width: 768px) {
    grid-template-columns: ${props => props.$singleVideo ? '1fr' : 'repeat(2, 1fr)'};
  }
`;

const ReviewSection = styled.div`
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid ${props => props.theme.colors.borderLight};
`;

const ReviewHeader = styled.h2`
  font-size: ${props => props.theme.typography.sizes['2xl']};
  font-weight: ${props => props.theme.typography.weights.bold};
  color: ${props => props.theme.colors.text};
  margin-bottom: 1.5rem;
`;

const ReviewForm = styled.div`
  background: ${props => props.theme.colors.backgroundSecondary};
  padding: 2rem;
  border-radius: ${props => props.theme.radius.lg};
  margin-bottom: 2rem;
  border: 1px solid ${props => props.theme.colors.borderLight};
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: ${props => props.theme.typography.weights.semibold};
  color: ${props => props.theme.colors.text};
  font-size: ${props => props.theme.typography.sizes.sm};
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.875rem;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.radius.md};
  font-size: ${props => props.theme.typography.sizes.base};
  font-family: inherit;
  resize: vertical;
  min-height: 100px;
  background: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.text};
  transition: all ${props => props.theme.transitions.fast};

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primary}20;
  }

  &::placeholder {
    color: ${props => props.theme.colors.textTertiary};
  }
`;

const ReviewList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const ReviewCard = styled.div`
  background: ${props => props.theme.colors.backgroundSecondary};
  padding: 1.5rem;
  border-radius: ${props => props.theme.radius.lg};
  border: 1px solid ${props => props.theme.colors.borderLight};
`;

const ReviewHeader2 = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const ReviewerInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const Avatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
`;

const AvatarPlaceholder = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: ${props => props.theme.typography.weights.bold};
  font-size: ${props => props.theme.typography.sizes.sm};
`;

const ReviewerDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const ReviewerName = styled.span`
  font-weight: ${props => props.theme.typography.weights.semibold};
  color: ${props => props.theme.colors.text};
  font-size: ${props => props.theme.typography.sizes.base};
`;

const ReviewDate = styled.span`
  font-size: ${props => props.theme.typography.sizes.xs};
  color: ${props => props.theme.colors.textTertiary};
`;

const ReviewComment = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  font-size: ${props => props.theme.typography.sizes.base};
  line-height: ${props => props.theme.typography.lineHeights.relaxed};
  margin-top: 0.75rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: ${props => props.theme.colors.textTertiary};
  font-size: ${props => props.theme.typography.sizes.base};
`;

const PurchaseRequired = styled.div`
  background: ${props => props.theme.colors.backgroundSecondary};
  padding: 1.5rem;
  border-radius: ${props => props.theme.radius.lg};
  border: 1px solid ${props => props.theme.colors.borderLight};
  text-align: center;
  color: ${props => props.theme.colors.textSecondary};
  margin-bottom: 2rem;
`;

const CheatSheetDetail = () => {
  const { id } = useParams();
  const { isAuthenticated, login, user } = useAuth();
  const { refreshCartCount } = useCart();
  const navigate = useNavigate();
  const [cheatSheet, setCheatSheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [qrCode, setQRCode] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Review states
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ average_rating: 0, total_reviews: 0 });
  const [myReview, setMyReview] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchCheatSheet();
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyReview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isAuthenticated]);

  const fetchCheatSheet = async () => {
    try {
      const response = await cheatSheetsAPI.getById(id);
      setCheatSheet(response.data.cheat_sheet);
    } catch (error) {
      console.error('Failed to fetch cheat sheet:', error);
      toast.error('Failed to load cheat sheet');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      login();
      return;
    }

    setAddingToCart(true);
    try {
      const response = await cartAPI.addToCart(cheatSheet.cheatsheet_id);

      // Check if item was already in cart
      if (response.data.already_in_cart) {
        toast('Item already in cart', {
          icon: <InfoIcon size={20} color="#3b82f6" />
        });
      } else {
        toast.success('Added to cart!');
      }

      // Refresh cart count badge
      refreshCartCount();

      // Navigate to cart page
      navigate('/cart');
    } catch (error) {
      if (error.response?.status === 409) {
        toast.error('Item already in cart');
        navigate('/cart');
      } else if (error.response?.status === 400) {
        toast.error(error.response.data.message || 'Cannot add to cart');
      } else {
        toast.error('Failed to add to cart');
      }
    } finally {
      setAddingToCart(false);
    }
  };

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      login();
      return;
    }

    try {
      const response = await paymentsAPI.createPayment(id);
      setQRCode(response.data.purchase.qr_code);
      setOrderId(response.data.purchase.order_id);
      setShowQR(true);
      toast.success('Payment QR code generated!');
    } catch (error) {
      console.error('Purchase failed:', error);
      toast.error(error.response?.data?.message || 'Purchase failed');
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);

    // Show loading toast with file size info
    const fileSizeInfo = cheatSheet.file_size_mb ? ` (${cheatSheet.file_size_mb} MB)` : '';
    const downloadToast = toast.loading(`Downloading PDF${fileSizeInfo}... Please wait, this may take a moment for large files.`);

    try {
      // Check if it's a free cheat sheet
      const isFree = parseFloat(cheatSheet.price) === 0;

      let response;
      if (isFree) {
        // Use the free download endpoint
        response = await cheatSheetsAPI.downloadFree(id);
      } else {
        // Use the regular purchase download endpoint
        response = await purchasesAPI.downloadCheatSheet(cheatSheet.order_id);
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${cheatSheet.title}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      // Dismiss loading toast and show success
      toast.success('Download completed successfully!', { id: downloadToast });
    } catch (error) {
      console.error('Download failed:', error);
      // Dismiss loading toast and show error
      toast.error(error.response?.data?.message || 'Download failed', { id: downloadToast });
    } finally {
      setIsDownloading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await reviewsAPI.getReviewsForCheatSheet(id, { sort: 'recent' });
      setReviews(response.data.reviews || []);
      setReviewStats(response.data.stats || { average_rating: 0, total_reviews: 0, verified_reviews: 0 });
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      // Set empty state on error instead of leaving undefined
      setReviews([]);
      setReviewStats({ average_rating: 0, total_reviews: 0, verified_reviews: 0 });
    }
  };

  const fetchMyReview = async () => {
    try {
      const response = await reviewsAPI.getMyReview(id);
      if (response.data && response.data.review) {
        setMyReview(response.data.review);
        setRating(response.data.review.rating || 0);
        setComment(response.data.review.comment || '');
      }
    } catch (error) {
      // No review found - that's okay
      if (error.response?.status !== 404) {
        console.error('Failed to fetch my review:', error);
      }
      // Reset to default state
      setMyReview(null);
      setRating(0);
      setComment('');
    }
  };

  const handleSubmitReview = async () => {
    if (!rating) {
      toast.error('Please select a rating');
      return;
    }

    setSubmittingReview(true);
    try {
      await reviewsAPI.createOrUpdateReview(id, rating, comment);
      toast.success(myReview ? 'Review updated!' : 'Review submitted!');

      // Clear the form
      setRating(0);
      setComment('');

      // Refresh data
      await fetchReviews();
      await fetchMyReview();
    } catch (error) {
      console.error('Failed to submit review:', error);
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const formatDate = React.useCallback((dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!cheatSheet) {
    return <Container>Cheat sheet not found</Container>;
  }

  return (
    <Container>
      <Card>
        <Header>
          <HeaderTop>
            <HeaderContent>
              <BadgeContainer>
                <CourseCode>{cheatSheet.course_code}</CourseCode>
                {cheatSheet.is_purchased && parseFloat(cheatSheet.price || 0) > 0 && <Badge>PURCHASED</Badge>}
              </BadgeContainer>
              <Title>{cheatSheet.title}</Title>
            </HeaderContent>
            {isAuthenticated && (user?.is_admin || user?.user_id === cheatSheet.created_by) && (
              <EditButton onClick={() => navigate(`/cheatsheet/${id}/edit`)}>
                Edit Cheat Sheet
              </EditButton>
            )}
          </HeaderTop>
          <Meta>
            <span><StarIcon size={16} /> {parseFloat(cheatSheet.average_rating || 0).toFixed(1)} ({cheatSheet.review_count || 0} reviews)</span>
            <span><EyeIcon size={16} /> {cheatSheet.view_count || 0} views</span>
            <span><CartIcon size={16} /> {cheatSheet.purchase_count || 0} purchases</span>
          </Meta>
        </Header>

        <Description>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({node, ...props}) => {
                const href = props.href || '';
                // Ensure external links have proper protocol
                const fixedHref = href.match(/^https?:\/\//) ? href : `https://${href}`;
                return <a {...props} href={fixedHref} target="_blank" rel="noopener noreferrer" />;
              }
            }}
          >
            {cheatSheet.description}
          </ReactMarkdown>
        </Description>

        {cheatSheet.creator_name && (
          <UploaderInfo>
            <UploaderAvatar>
              {cheatSheet.creator_avatar ? (
                <UploaderAvatarImg
                  src={cheatSheet.creator_avatar}
                  alt={cheatSheet.creator_name}
                  loading="lazy"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerText = cheatSheet.creator_name.charAt(0).toUpperCase();
                  }}
                />
              ) : (
                cheatSheet.creator_name.charAt(0).toUpperCase()
              )}
            </UploaderAvatar>
            <UploaderDetails>
              <UploaderLabel>Uploaded by</UploaderLabel>
              <UploaderName>{cheatSheet.creator_name}</UploaderName>
            </UploaderDetails>
          </UploaderInfo>
        )}

        {cheatSheet.preview_image_path && (
          <PreviewSection>
            <PreviewTitle>Preview</PreviewTitle>
            <PreviewImage
              src={cheatSheet.preview_image_path?.startsWith('http')
                ? cheatSheet.preview_image_path
                : `${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/${cheatSheet.preview_image_path.replace(/\\/g, '/')}`}
              alt={`${cheatSheet.title} preview`}
              onError={(e) => {
                console.error('Failed to load preview image:', cheatSheet.preview_image_path);
                e.target.parentElement.style.display = 'none';
              }}
            />
          </PreviewSection>
        )}

        <InfoGrid>
          {cheatSheet.semester && (
            <InfoItem>
              <strong>Semester</strong>
              <span>{cheatSheet.semester}</span>
            </InfoItem>
          )}
          {cheatSheet.academic_year && (
            <InfoItem>
              <strong>Academic Year</strong>
              <span>{cheatSheet.academic_year}</span>
            </InfoItem>
          )}
          {cheatSheet.year_level && (
            <InfoItem>
              <strong>Year Level</strong>
              <span>{cheatSheet.year_level}</span>
            </InfoItem>
          )}
          {cheatSheet.exam_type && (
            <InfoItem>
              <strong>Exam Type</strong>
              <span>{cheatSheet.exam_type}</span>
            </InfoItem>
          )}
          {cheatSheet.page_count && (
            <InfoItem>
              <strong>Pages</strong>
              <span>{cheatSheet.page_count} pages</span>
            </InfoItem>
          )}
          {cheatSheet.file_size_mb && (
            <InfoItem>
              <strong>File Size</strong>
              <span>{cheatSheet.file_size_mb} MB</span>
            </InfoItem>
          )}
        </InfoGrid>

        {cheatSheet.youtube_links && (() => {
          try {
            const links = typeof cheatSheet.youtube_links === 'string'
              ? JSON.parse(cheatSheet.youtube_links)
              : cheatSheet.youtube_links;

            if (Array.isArray(links) && links.length > 0) {
              return (
                <YouTubeSection>
                  <YouTubeTitle>Related Videos</YouTubeTitle>
                  <YouTubeGrid $singleVideo={links.length === 1}>
                    {links.map((url, index) => (
                      <YouTubeEmbed
                        key={index}
                        url={url}
                        title={`${cheatSheet.title} - Video ${index + 1}`}
                      />
                    ))}
                  </YouTubeGrid>
                </YouTubeSection>
              );
            }
          } catch (e) {
            console.warn('Failed to parse youtube_links:', e);
          }
          return null;
        })()}

        <PriceSection>
          <Price>
            {parseFloat(cheatSheet.price || 0) === 0 ? 'FREE' : `${parseFloat(cheatSheet.price).toFixed(2)} ฿`}
          </Price>
          {cheatSheet.is_purchased || parseFloat(cheatSheet.price || 0) === 0 ? (
            isAuthenticated ? (
              <Button onClick={handleDownload} disabled={isDownloading}>
                {isDownloading ? 'Downloading...' : 'Download PDF'}
              </Button>
            ) : (
              <Button onClick={() => authAPI.loginWithGoogle()}>Login to Download</Button>
            )
          ) : cheatSheet.purchase_status === 'pending' ? (
            <Button disabled>Payment Pending Approval</Button>
          ) : (
            <Button onClick={handleAddToCart} disabled={addingToCart}>
              <CartIcon size={20} color="#fff" />
              {addingToCart ? 'Adding...' : (isAuthenticated ? 'Add to Cart' : 'Login to Add to Cart')}
            </Button>
          )}
        </PriceSection>

        <ReviewSection>
          <ReviewHeader>
            Reviews ({reviewStats.total_reviews || reviews.length})
          </ReviewHeader>

          {/* Review Form - Show for free cheat sheets or users who purchased */}
          {isAuthenticated && !myReview && (
            (parseFloat(cheatSheet.price || 0) === 0) ||
            (cheatSheet.is_purchased && cheatSheet.purchase_status === 'paid')
          ) && (
            <ReviewForm>
              <FormGroup>
                <Label>Your Rating *</Label>
                <StarRating
                  value={rating}
                  onChange={setRating}
                  allowHalf={true}
                  showValue={true}
                  size="32px"
                />
              </FormGroup>

              <FormGroup>
                <Label>Your Review (Optional)</Label>
                <TextArea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts about this cheat sheet..."
                  maxLength={500}
                />
              </FormGroup>

              <Button onClick={handleSubmitReview} disabled={submittingReview || !rating}>
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </Button>
            </ReviewForm>
          )}

          {/* Message for users who already reviewed */}
          {isAuthenticated && myReview && (
            (parseFloat(cheatSheet.price || 0) === 0) ||
            (cheatSheet.is_purchased && cheatSheet.purchase_status === 'paid')
          ) && (
            <div style={{
              background: '#e8f5e9',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              border: '1px solid #4caf50',
              color: '#2e7d32',
              fontSize: '14px'
            }}>
              ✓ You reviewed this cheat sheet on {formatDate(myReview.created_at)}. Thank you for your feedback!
            </div>
          )}

          {/* Message for non-purchasers (only for paid cheat sheets) */}
          {isAuthenticated && parseFloat(cheatSheet.price || 0) > 0 && (!cheatSheet.is_purchased || cheatSheet.purchase_status !== 'paid') && (
            <PurchaseRequired>
              <p>Purchase this cheat sheet to leave a review</p>
            </PurchaseRequired>
          )}

          {/* Reviews List - Show ALL reviews for everyone */}
          {reviews && reviews.length > 0 ? (
            <ReviewList>
              {reviews.map((review) => {
                const userInitial = review.user_name ? review.user_name.charAt(0).toUpperCase() : '?';
                const ratingValue = parseFloat(review.rating) || 0;

                return (
                  <ReviewCard key={review.review_id}>
                    <ReviewHeader2>
                      <ReviewerInfo>
                        {review.avatar_url ? (
                          <Avatar
                            src={review.avatar_url}
                            alt={review.user_name || 'User'}
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <AvatarPlaceholder>
                            {userInitial}
                          </AvatarPlaceholder>
                        )}
                        <ReviewerDetails>
                          <ReviewerName>{review.user_name || 'Anonymous'}</ReviewerName>
                          <ReviewDate>{review.created_at ? formatDate(review.created_at) : 'Unknown date'}</ReviewDate>
                        </ReviewerDetails>
                      </ReviewerInfo>
                    </ReviewHeader2>

                    <StarRating
                      value={ratingValue}
                      showValue={false}
                      size="20px"
                    />

                    {review.comment && (
                      <ReviewComment>{review.comment}</ReviewComment>
                    )}
                  </ReviewCard>
                );
              })}
            </ReviewList>
          ) : (
            <EmptyState>
              No reviews yet. Be the first to review this cheat sheet!
            </EmptyState>
          )}
        </ReviewSection>
      </Card>

      {showQR && (
        <QRModal onClick={() => setShowQR(false)}>
          <QRContent onClick={(e) => e.stopPropagation()}>
            <h2>Scan to Pay</h2>
            <QRImage src={qrCode} alt="PromptPay QR Code" />
            <p>Amount: <strong>{parseFloat(cheatSheet.price || 0).toFixed(2)} ฿</strong></p>
            <Instructions>
              <ol>
                <li>Open your banking app</li>
                <li>Scan this QR code</li>
                <li>Pay exactly {parseFloat(cheatSheet.price || 0).toFixed(2)} ฿</li>
                <li>Wait for admin approval (usually within 24 hours)</li>
                <li>You'll be able to download after approval</li>
              </ol>
            </Instructions>
            <Button onClick={() => setShowQR(false)} style={{ marginTop: '1rem' }}>
              Close
            </Button>
          </QRContent>
        </QRModal>
      )}
    </Container>
  );
};

export default CheatSheetDetail;
