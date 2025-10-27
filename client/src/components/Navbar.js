import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CartIcon } from './Icons';
import { cartAPI } from '../services/api';
import PeanutIcon from './PeanutIcon';

const Nav = styled.nav`
  background: ${props => props.theme.colors.surface};
  box-shadow: ${props => props.theme.shadows.sm};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
  transition: all ${props => props.theme.transitions.normal};
`;

const Logo = styled(Link)`
  font-size: ${props => props.theme.typography.sizes.xl};
  font-weight: ${props => props.theme.typography.weights.bold};
  color: ${props => props.theme.colors.primary};
  letter-spacing: -0.02em;
  transition: color ${props => props.theme.transitions.fast};
  text-decoration: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    color: ${props => props.theme.colors.primaryHover};
  }
`;

const StyledPeanutIcon = styled(PeanutIcon)`
  width: 32px;
  height: 32px;
  fill: currentColor;
  transition: all ${props => props.theme.transitions.fast};
`;

const NavLinks = styled.div`
  display: flex;
  gap: 1.5rem;
  align-items: center;

  @media (max-width: 768px) {
    position: fixed;
    top: 60px;
    right: ${props => props.$isOpen ? '0' : '-100%'};
    width: 70%;
    max-width: 300px;
    height: calc(100vh - 60px);
    background: ${props => props.theme.colors.surface};
    flex-direction: column;
    align-items: flex-start;
    padding: 2rem;
    box-shadow: -2px 0 12px rgba(0,0,0,0.2);
    transition: right 0.3s ease-in-out;
    gap: 1.5rem;
    overflow-y: auto;
  }
`;

const HamburgerButton = styled.button`
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;

  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  span {
    width: 25px;
    height: 3px;
    background: ${props => props.theme.colors.text};
    transition: all 0.3s;
    transform-origin: center;
    border-radius: 2px;

    ${props => props.$isOpen && `
      &:nth-child(1) {
        transform: translateY(7px) rotate(45deg);
      }
      &:nth-child(2) {
        opacity: 0;
      }
      &:nth-child(3) {
        transform: translateY(-7px) rotate(-45deg);
      }
    `}
  }
`;

const Overlay = styled.div`
  display: none;

  @media (max-width: 768px) {
    display: ${props => props.$isOpen ? 'block' : 'none'};
    position: fixed;
    top: 60px;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    z-index: 98;
  }
`;

const NavLink = styled(Link)`
  color: ${props => props.theme.colors.text};
  font-weight: ${props => props.theme.typography.weights.medium};
  transition: color ${props => props.theme.transitions.fast};
  position: relative;
  text-decoration: none;

  &:hover {
    color: ${props => props.theme.colors.primary};
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    width: 0;
    height: 2px;
    background: ${props => props.theme.colors.primary};
    transition: width ${props => props.theme.transitions.fast};
  }

  &:hover::after {
    width: 100%;
  }
`;

const Button = styled.button`
  background: ${props => props.$primary ? props.theme.colors.primary : 'transparent'};
  color: ${props => props.$primary ? '#fff' : props.theme.colors.text};
  border: ${props => props.$primary ? 'none' : `2px solid ${props.theme.colors.border}`};
  padding: 0.5rem 1.25rem;
  border-radius: ${props => props.theme.radius.md};
  font-weight: ${props => props.theme.typography.weights.semibold};
  transition: all ${props => props.theme.transitions.fast};
  font-size: ${props => props.theme.typography.sizes.sm};

  &:hover {
    background: ${props => props.$primary ? props.theme.colors.primaryHover : props.theme.colors.primary};
    color: #fff;
    transform: translateY(-1px);
    box-shadow: ${props => props.theme.shadows.sm};
  }

  &:active {
    transform: translateY(0);
  }
`;

// Google Sign-In Button Wrapper
const GoogleSignInButton = styled.div`
  display: inline-block;
  cursor: pointer;

  .gsi-material-button {
    -moz-user-select: none;
    -webkit-user-select: none;
    -ms-user-select: none;
    -webkit-appearance: none;
    background-color: WHITE;
    background-image: none;
    border: 1px solid #747775;
    -webkit-border-radius: 20px;
    border-radius: 20px;
    -webkit-box-sizing: border-box;
    box-sizing: border-box;
    color: #1f1f1f;
    cursor: pointer;
    font-family: 'Roboto', arial, sans-serif;
    font-size: 14px;
    height: 40px;
    letter-spacing: 0.25px;
    outline: none;
    overflow: hidden;
    padding: 0 12px;
    position: relative;
    text-align: center;
    -webkit-transition: background-color .218s, border-color .218s, box-shadow .218s;
    transition: background-color .218s, border-color .218s, box-shadow .218s;
    vertical-align: middle;
    white-space: nowrap;
    width: auto;
    max-width: 400px;
    min-width: min-content;
  }

  .gsi-material-button .gsi-material-button-icon {
    height: 20px;
    margin-right: 12px;
    min-width: 20px;
    width: 20px;
  }

  .gsi-material-button .gsi-material-button-content-wrapper {
    -webkit-align-items: center;
    align-items: center;
    display: flex;
    -webkit-flex-direction: row;
    flex-direction: row;
    -webkit-flex-wrap: nowrap;
    flex-wrap: nowrap;
    height: 100%;
    justify-content: space-between;
    position: relative;
    width: 100%;
  }

  .gsi-material-button .gsi-material-button-contents {
    -webkit-flex-grow: 1;
    flex-grow: 1;
    font-family: 'Roboto', arial, sans-serif;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: top;
  }

  .gsi-material-button .gsi-material-button-state {
    -webkit-transition: opacity .218s;
    transition: opacity .218s;
    bottom: 0;
    left: 0;
    opacity: 0;
    position: absolute;
    right: 0;
    top: 0;
  }

  .gsi-material-button:disabled {
    cursor: default;
    background-color: #ffffff61;
    border-color: #1f1f1f1f;
  }

  .gsi-material-button:disabled .gsi-material-button-contents {
    opacity: 38%;
  }

  .gsi-material-button:disabled .gsi-material-button-icon {
    opacity: 38%;
  }

  .gsi-material-button:not(:disabled):active .gsi-material-button-state,
  .gsi-material-button:not(:disabled):focus .gsi-material-button-state {
    background-color: #303030;
    opacity: 12%;
  }

  .gsi-material-button:not(:disabled):hover {
    -webkit-box-shadow: 0 1px 2px 0 rgba(60, 64, 67, .30), 0 1px 3px 1px rgba(60, 64, 67, .15);
    box-shadow: 0 1px 2px 0 rgba(60, 64, 67, .30), 0 1px 3px 1px rgba(60, 64, 67, .15);
  }

  .gsi-material-button:not(:disabled):hover .gsi-material-button-state {
    background-color: #303030;
    opacity: 8%;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const Avatar = styled.img`
  width: 35px;
  height: 35px;
  border-radius: 50%;
  object-fit: cover;
  background: #f0f0f0;
`;

const AvatarFallback = styled.div`
  width: 35px;
  height: 35px;
  border-radius: 50%;
  background: #131D4F;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
`;

const NavLinkWithBadge = styled(Link)`
  color: ${props => props.theme.colors.text};
  font-weight: ${props => props.theme.typography.weights.medium};
  transition: color ${props => props.theme.transitions.fast};
  position: relative;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    color: ${props => props.theme.colors.primary};
  }

  /* Make icon inherit color on hover */
  &:hover svg {
    stroke: ${props => props.theme.colors.primary};
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    width: 0;
    height: 2px;
    background: ${props => props.theme.colors.primary};
    transition: width ${props => props.theme.transitions.fast};
  }

  &:hover::after {
    width: 100%;
  }
`;

const CartWrapper = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
`;

const CartBadge = styled.span`
  position: absolute;
  top: -8px;
  right: -8px;
  background: ${props => props.theme.colors.error};
  color: white;
  font-size: 0.75rem;
  font-weight: bold;
  padding: 0.125rem 0.375rem;
  border-radius: ${props => props.theme.radius.full};
  min-width: 18px;
  text-align: center;
  line-height: 1;
`;

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, isSeller, isStaff, canUpload, canManageApprovals, login, logout } = useAuth();
  const [imageError, setImageError] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // DEBUG: Uncomment for troubleshooting user roles (SECURITY: Remove in production)
  // React.useEffect(() => {
  //   if (user) {
  //     console.log('🔍 User Roles:', {
  //       is_admin: user.is_admin,
  //       is_seller: user.is_seller,
  //       is_staff: user.is_staff,
  //       isAdmin,
  //       isSeller,
  //       isStaff,
  //       shouldShowStaffOnly: isStaff && !isAdmin
  //     });
  //   }
  // }, [user, isAdmin, isSeller, isStaff]);

  // Get user initials for fallback avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleImageError = () => {
    setImageError(true);
  };

  // Reset error state when user changes
  React.useEffect(() => {
    setImageError(false);
  }, [user?.user_id]);

  // Fetch cart count on mount and when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchCartCount();
    } else {
      setCartCount(0);
    }
  }, [isAuthenticated]);

  const fetchCartCount = async () => {
    try {
      const response = await cartAPI.getCartCount();
      setCartCount(response.data.count);
    } catch (error) {
      console.error('Failed to fetch cart count:', error);
    }
  };

  return (
    <>
      <Nav>
        <Logo to="/">
          <StyledPeanutIcon />
          Peanut Cheat Sheets
        </Logo>

        <HamburgerButton
          $isOpen={isMenuOpen}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </HamburgerButton>

        <NavLinks $isOpen={isMenuOpen}>
          {isAuthenticated ? (
            <>
              {/* All authenticated users see these basic tabs */}
              <NavLink to="/" onClick={() => setIsMenuOpen(false)}>Browse</NavLink>
              <NavLink to="/my-purchases" onClick={() => setIsMenuOpen(false)}>Library</NavLink>
              <NavLink to="/support" onClick={() => setIsMenuOpen(false)}>Support</NavLink>
              <NavLinkWithBadge to="/cart" onClick={() => setIsMenuOpen(false)}>
                <CartWrapper>
                  <CartIcon size={20} />
                  {cartCount > 0 && <CartBadge>{cartCount}</CartBadge>}
                </CartWrapper>
                Cart
              </NavLinkWithBadge>

              {/* Apply to be Seller - hide if already seller/admin/staff */}
              {!isSeller && !isAdmin && !isStaff && (
                <NavLink to="/apply-seller" onClick={() => setIsMenuOpen(false)}>Apply to be Seller</NavLink>
              )}

              {/* Upload tab - for sellers and admins */}
              {canUpload && (
                <NavLink to="/admin/upload" onClick={() => setIsMenuOpen(false)}>Upload</NavLink>
              )}

              {/* Approvals tab - for staff and admins */}
              {(isStaff || isAdmin) && (
                <NavLink to="/admin" onClick={() => setIsMenuOpen(false)}>
                  {isAdmin ? 'Admin' : 'Approvals'}
                </NavLink>
              )}

              {/* Analytics tab - for admins only */}
              {isAdmin && (
                <NavLink to="/admin/analytics" onClick={() => setIsMenuOpen(false)}>Analytics</NavLink>
              )}
            </>
          ) : (
            <>
              {/* Unauthenticated users: Only see Browse */}
              <NavLink to="/" onClick={() => setIsMenuOpen(false)}>Browse</NavLink>
            </>
          )}

          {isAuthenticated ? (
            <UserInfo>
              {user?.avatar_url && !imageError ? (
                <Avatar
                  src={user.avatar_url}
                  alt={user.name}
                  onError={handleImageError}
                  crossOrigin="anonymous"
                />
              ) : (
                <AvatarFallback title={user?.name}>
                  {getInitials(user?.name)}
                </AvatarFallback>
              )}
              <span>{user?.name}</span>
              <Button onClick={() => { logout(); setIsMenuOpen(false); }}>Logout</Button>
            </UserInfo>
          ) : (
            <GoogleSignInButton onClick={() => { login(); setIsMenuOpen(false); }}>
              <button className="gsi-material-button">
                <div className="gsi-material-button-state"></div>
                <div className="gsi-material-button-content-wrapper">
                  <div className="gsi-material-button-icon">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{display: 'block'}}>
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                  </div>
                  <span className="gsi-material-button-contents">Sign in with Google</span>
                </div>
              </button>
            </GoogleSignInButton>
          )}
        </NavLinks>
      </Nav>
      <Overlay $isOpen={isMenuOpen} onClick={() => setIsMenuOpen(false)} />
    </>
  );
};

export default Navbar;
