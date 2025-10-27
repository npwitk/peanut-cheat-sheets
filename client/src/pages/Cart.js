import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { cartAPI, paymentsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CartIcon, TrashIcon } from '../components/Icons';
import LoadingSpinner from '../components/LoadingSpinner';

const Container = styled.div`
  max-width: 1200px;
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
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 2rem;

  @media (max-width: 968px) {
    grid-template-columns: 1fr;
  }
`;

const CartItems = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const CartItem = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.radius.lg};
  padding: 1.5rem;
  display: flex;
  gap: 1.5rem;
  box-shadow: ${props => props.theme.shadows.md};
  border: 1px solid ${props => props.theme.colors.border};
  transition: all ${props => props.theme.transitions.fast};

  &:hover {
    box-shadow: ${props => props.theme.shadows.lg};
  }

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const PreviewImage = styled.img`
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: ${props => props.theme.radius.md};
  background: ${props => props.theme.colors.backgroundSecondary};

  @media (max-width: 768px) {
    width: 100%;
    height: 200px;
  }
`;

const ItemDetails = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const CourseCode = styled.span`
  background: ${props => props.theme.colors.primary};
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: ${props => props.theme.radius.full};
  font-size: ${props => props.theme.typography.sizes.xs};
  font-weight: ${props => props.theme.typography.weights.semibold};
  align-self: flex-start;
`;

const ItemTitle = styled.h3`
  font-size: ${props => props.theme.typography.sizes.lg};
  color: ${props => props.theme.colors.text};
  font-weight: ${props => props.theme.typography.weights.semibold};
`;

const ItemPrice = styled.div`
  font-size: ${props => props.theme.typography.sizes.xl};
  color: ${props => props.theme.colors.primary};
  font-weight: ${props => props.theme.typography.weights.bold};
`;

const RemoveButton = styled.button`
  background: transparent;
  border: none;
  color: ${props => props.theme.colors.error};
  cursor: pointer;
  padding: 0.5rem;
  transition: all ${props => props.theme.transitions.fast};
  align-self: flex-start;

  &:hover {
    transform: scale(1.1);
  }
`;

const Summary = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.radius.lg};
  padding: 2rem;
  box-shadow: ${props => props.theme.shadows.lg};
  border: 1px solid ${props => props.theme.colors.border};
  position: sticky;
  top: 2rem;
  height: fit-content;
`;

const SummaryTitle = styled.h2`
  font-size: ${props => props.theme.typography.sizes.xl};
  margin-bottom: 1.5rem;
  color: ${props => props.theme.colors.text};
  font-weight: ${props => props.theme.typography.weights.semibold};
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  font-size: ${props => props.theme.typography.sizes.base};
  color: ${props => props.theme.colors.textSecondary};

  ${props => props.$bold && `
    font-weight: ${props.theme.typography.weights.bold};
    color: ${props.theme.colors.text};
    font-size: ${props.theme.typography.sizes.lg};
    border-top: 2px solid ${props.theme.colors.border};
    margin-top: 0.5rem;
    padding-top: 1rem;
  `}
`;

const DiscountBadge = styled.div`
  background: ${props => props.theme.colors.success};
  color: white;
  padding: 0.5rem 1rem;
  border-radius: ${props => props.theme.radius.md};
  text-align: center;
  font-weight: ${props => props.theme.typography.weights.semibold};
  margin: 1rem 0;
`;

const CheckoutButton = styled.button`
  width: 100%;
  background: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: ${props => props.theme.radius.md};
  font-weight: ${props => props.theme.typography.weights.semibold};
  font-size: ${props => props.theme.typography.sizes.base};
  cursor: pointer;
  transition: all ${props => props.theme.transitions.fast};
  margin-top: 1.5rem;

  &:hover {
    background: ${props => props.theme.colors.primaryHover};
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.lg};
  }

  &:disabled {
    background: ${props => props.theme.colors.textTertiary};
    cursor: not-allowed;
    transform: none;
  }
`;

const EmptyCart = styled.div`
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

const Button = styled.button`
  background: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  padding: 0.875rem 1.5rem;
  border-radius: ${props => props.theme.radius.md};
  font-weight: ${props => props.theme.typography.weights.semibold};
  font-size: ${props => props.theme.typography.sizes.base};
  cursor: pointer;
  transition: all ${props => props.theme.transitions.fast};

  &:hover {
    background: ${props => props.theme.colors.primaryHover};
    transform: translateY(-1px);
    box-shadow: ${props => props.theme.shadows.md};
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.radius.xl};
  padding: 2rem;
  max-width: 500px;
  width: 100%;
  text-align: center;
`;

const QRCode = styled.img`
  width: 300px;
  height: 300px;
  margin: 1.5rem auto;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.radius.md};
`;

const Cart = () => {
  const [cart, setCart] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrData, setQrData] = useState(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Scroll to top when component mounts or route changes
    window.scrollTo(0, 0);
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated]);

  const fetchCart = async () => {
    try {
      const response = await cartAPI.getCart();
      setCart(response.data.cart_items);
      setSummary(response.data.summary);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (cart_id) => {
    try {
      await cartAPI.removeFromCart(cart_id);
      toast.success('Item removed from cart');
      fetchCart(); // Refresh cart
    } catch (error) {
      console.error('Failed to remove item:', error);
      toast.error('Failed to remove item');
    }
  };

  const handleCheckout = async () => {
    setCheckingOut(true);
    try {
      // Step 1: Create order from cart
      const checkoutResponse = await cartAPI.checkout();
      const { bundle_order_id, total_amount } = checkoutResponse.data;

      toast.success('Order created! Generating payment QR code...');

      // Step 2: Create payment (generates QR code)
      const paymentResponse = await paymentsAPI.createBundlePayment(bundle_order_id);

      // Show QR code modal
      setQrData({
        qr_code: paymentResponse.data.bundle.qr_code,
        amount: total_amount,
        bundle_order_id: bundle_order_id,
      });
      setShowQR(true);

      // Clear cart display
      setCart([]);
      setSummary(null);

    } catch (error) {
      console.error('Checkout failed:', error);

      if (error.response?.status === 409) {
        toast.error('You already own one or more items in your cart');
      } else {
        toast.error(error.response?.data?.message || 'Checkout failed');
      }
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading cart..." />;
  }

  if (cart.length === 0 && !showQR) {
    return (
      <Container>
        <EmptyCart>
          <h2>Your cart is empty</h2>
          <p>Browse our cheat sheets and add some to your cart!</p>
          <Button onClick={() => navigate('/')}>Browse Cheat Sheets</Button>
        </EmptyCart>
      </Container>
    );
  }

  return (
    <Container>
      <Title>
        <CartIcon size={36} />
        Shopping Cart
      </Title>

      <Grid>
        <CartItems>
          {cart.map((item) => (
            <CartItem key={item.cart_id}>
              {item.preview_image_path && (
                <PreviewImage
                  src={item.preview_image_path}
                  alt={item.title}
                />
              )}
              <ItemDetails>
                <CourseCode>{item.course_code}</CourseCode>
                <ItemTitle>{item.title}</ItemTitle>
                <ItemPrice>{parseFloat(item.price).toFixed(2)} ฿</ItemPrice>
              </ItemDetails>
              <RemoveButton onClick={() => handleRemove(item.cart_id)}>
                <TrashIcon size={20} />
              </RemoveButton>
            </CartItem>
          ))}
        </CartItems>

        {summary && (
          <Summary>
            <SummaryTitle>Order Summary</SummaryTitle>

            <SummaryRow>
              <span>Subtotal ({summary.item_count} items)</span>
              <span>{summary.subtotal} ฿</span>
            </SummaryRow>

            {summary.is_bundle && summary.discount_amount > 0 && (
              <>
                <SummaryRow>
                  <span>Bundle Discount ({summary.discount_percentage}%)</span>
                  <span style={{ color: '#34C759' }}>-{summary.discount_amount} ฿</span>
                </SummaryRow>
                <DiscountBadge>
                  You're saving {summary.discount_amount} ฿!
                </DiscountBadge>
              </>
            )}

            <SummaryRow $bold>
              <span>Total</span>
              <span>{summary.total} ฿</span>
            </SummaryRow>

            <CheckoutButton
              onClick={handleCheckout}
              disabled={checkingOut || cart.length === 0}
            >
              {checkingOut ? 'Processing...' : 'Proceed to Checkout'}
            </CheckoutButton>

            {summary.is_bundle && (
              <p style={{
                marginTop: '1rem',
                fontSize: '0.875rem',
                color: '#6E6E73',
                textAlign: 'center'
              }}>
                Bundle discount applied automatically
              </p>
            )}
          </Summary>
        )}
      </Grid>

      {showQR && qrData && (
        <Modal onClick={() => setShowQR(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <h2>Scan to Pay</h2>
            <QRCode src={qrData.qr_code} alt="PromptPay QR Code" />
            <p>
              <strong>Amount: {qrData.amount} ฿</strong>
            </p>
            <p style={{ fontSize: '0.875rem', color: '#6E6E73', marginTop: '1rem' }}>
              Scan this QR code with your banking app to complete the payment.
              Your order will be processed once payment is confirmed.
            </p>
            <Button onClick={() => {
              setShowQR(false);
              navigate('/my-purchases');
            }} style={{ marginTop: '1.5rem' }}>
              Go to My Purchases
            </Button>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

export default Cart;
